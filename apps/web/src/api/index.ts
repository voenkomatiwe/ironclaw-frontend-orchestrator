import ky, { type Options } from "ky";
import { normalizeApiOrigin, useAppStore } from "@/store/app";

const RETRY_STATUS = [408, 429, 502, 503, 504] as const;

function resolveApiOrigin(): string {
  const stored = useAppStore.getState().apiUrl?.trim();
  if (stored) return stored;
  const env = import.meta.env.VITE_API_URL;
  if (typeof env === "string" && env.trim()) return normalizeApiOrigin(env);
  return "http://localhost:3000";
}

const sharedHooks = {
  beforeRequest: [
    (req: Request) => {
      const t = useAppStore.getState().token?.trim();
      if (t) req.headers.set("Authorization", `Bearer ${t}`);
    },
  ],
};

function createClient() {
  const origin = resolveApiOrigin();
  return ky.create({
    prefixUrl: `${origin}/api/`,
    timeout: 15_000,
    retry: { limit: 2, statusCodes: [...RETRY_STATUS] },
    hooks: sharedHooks,
  });
}

/** Same host as the gateway, paths relative to origin (e.g. `v1/models`), not under `/api/`. */
function createOriginClient() {
  const origin = resolveApiOrigin();
  return ky.create({
    prefixUrl: `${origin}/`,
    timeout: 15_000,
    retry: { limit: 2, statusCodes: [...RETRY_STATUS] },
    hooks: sharedHooks,
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
