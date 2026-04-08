import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

/**
 * Dynamic gateway proxy — solves CORS between the dev server and IronClaw gateway.
 *
 *   POST /__proxy/set-target  { url, token }  → validates via /api/health, stores in memory
 *   POST /__proxy/clear-target                 → clears stored credentials
 *   GET  /__proxy/status                       → { configured: boolean }
 *
 * Once configured every request to /gw/* is proxied to the gateway with the
 * stored Bearer token. The /api/* and /v1/* prefixes are also proxied so the
 * ky client can keep using relative paths.
 */
function gatewayProxy(fallbackTarget: string): Plugin {
  let targetUrl = fallbackTarget;
  let targetToken = "";

  function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
    res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(body));
  }

  function readBody(req: import("node:http").IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
      let data = "";
      req.on("data", (c: Buffer) => {
        data += c.toString();
      });
      req.on("end", () => resolve(data));
    });
  }

  async function proxyRequest(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
    upstreamPath: string
  ) {
    const url = `${targetUrl}${upstreamPath}`;
    const headers: Record<string, string> = {};
    if (targetToken) headers.Authorization = `Bearer ${targetToken}`;
    const ct = req.headers["content-type"];
    if (ct) headers["Content-Type"] = ct;
    const accept = req.headers.accept;
    if (accept) headers.Accept = accept;

    const body = req.method !== "GET" && req.method !== "HEAD" ? await readBody(req) : undefined;

    try {
      const up = await fetch(url, {
        method: req.method ?? "GET",
        headers,
        body: body || undefined,
      });

      const respHeaders: Record<string, string> = {};
      const upCt = up.headers.get("content-type");
      if (upCt) respHeaders["Content-Type"] = upCt;

      // SSE: stream the response
      if (upCt?.includes("text/event-stream") && up.body) {
        respHeaders["Cache-Control"] = "no-cache";
        respHeaders.Connection = "keep-alive";
        res.writeHead(up.status, respHeaders);
        const reader = up.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        };
        pump().catch(() => res.end());
        req.on("close", () => reader.cancel());
        return;
      }

      res.writeHead(up.status, respHeaders);
      res.end(await up.text());
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : "Proxy error" }));
    }
  }

  return {
    name: "gateway-proxy",
    configureServer(server) {
      // ── Control endpoints ──────────────────────────────────────────────
      server.middlewares.use("/__proxy/set-target", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
          });
          res.end();
          return;
        }
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }
        try {
          const raw = await readBody(req);
          const { url, token } = JSON.parse(raw);
          if (!url || !token) {
            sendJson(res, 400, { error: "url and token required" });
            return;
          }
          const base = url.replace(/\/+$/, "");
          const check = await fetch(`${base}/api/health`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!check.ok) {
            sendJson(res, check.status, { error: `Gateway returned ${check.status}` });
            return;
          }
          targetUrl = base;
          targetToken = token;
          sendJson(res, 200, { ok: true });
        } catch (e) {
          sendJson(res, 502, { error: e instanceof Error ? e.message : "Connection failed" });
        }
      });

      server.middlewares.use("/__proxy/clear-target", (_req, res) => {
        targetUrl = fallbackTarget;
        targetToken = "";
        sendJson(res, 200, { ok: true });
      });

      server.middlewares.use("/__proxy/status", (_req, res) => {
        sendJson(res, 200, { configured: !!targetToken, hasTarget: !!targetUrl });
      });

      // ── Proxy /gw/* (explicit proxy path, like orchestrator-v2) ────────
      server.middlewares.use("/gw", (req, res) => {
        if (!targetUrl) {
          sendJson(res, 401, { error: "Gateway not configured" });
          return;
        }
        void proxyRequest(req, res, req.url ?? "/");
      });

      // ── Proxy /api/* and /v1/* to gateway ──────────────────────────────
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url.startsWith("/api/") || url.startsWith("/v1/") || url === "/api" || url === "/v1") {
          if (!targetUrl) {
            sendJson(res, 502, { error: "Gateway target not set" });
            return;
          }
          void proxyRequest(req, res, url);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const fallback = env.VITE_ADDON_API_TARGET ?? "http://localhost:3000";

  return {
    plugins: [nodePolyfills(), react(), tailwindcss(), gatewayProxy(fallback)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // WebSocket proxy for /ws — still needed for WS upgrade
      proxy: {
        "/ws": { target: fallback, ws: true, changeOrigin: true },
      },
    },
  };
});
