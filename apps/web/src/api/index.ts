import ky, { type Options } from "ky";

const RETRY_STATUS = [408, 429, 502, 503, 504] as const;

/**
 * All requests go through the Vite dev-server proxy (same origin) which
 * forwards them to the IronClaw gateway. This avoids CORS entirely.
 *
 * - `api.*`        → prefixUrl = `/api/`   (gateway /api/* routes)
 * - `apiOrigin.*`  → prefixUrl = `/`       (gateway root, e.g. /v1/models)
 *
 * The Bearer token is injected server-side by the proxy, so we no longer
 * set Authorization on the client. The proxy target is configured via
 * `/__proxy/set-target` when the user logs in (see store/app.ts).
 */

function createClient() {
  return ky.create({
    prefixUrl: "/api/",
    timeout: 15_000,
    retry: { limit: 2, statusCodes: [...RETRY_STATUS] },
  });
}

function createOriginClient() {
  return ky.create({
    prefixUrl: "/",
    timeout: 15_000,
    retry: { limit: 2, statusCodes: [...RETRY_STATUS] },
  });
}

export const api = {
  get: (input: string, options?: Options) => createClient().get(input, options),
  post: (input: string, options?: Options) => createClient().post(input, options),
  put: (input: string, options?: Options) => createClient().put(input, options),
  delete: (input: string, options?: Options) => createClient().delete(input, options),
};

export const apiOrigin = {
  get: (path: string, options?: Options) => createOriginClient().get(path, options),
};
