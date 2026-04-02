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

/** @deprecated Use session API URL from the auth page; kept for rare direct reads */
export function getApiOrigin(): string {
  return resolveApiOrigin();
}

function createClient() {
  const origin = resolveApiOrigin();
  return ky.create({
    prefixUrl: `${origin}`,
    timeout: 15_000,
    retry: { limit: 2, statusCodes: [...RETRY_STATUS] },
    hooks: {
      beforeRequest: [
        (req) => {
          const t = useAppStore.getState().token?.trim();
          if (t) req.headers.set("Authorization", `Bearer ${t}`);
        },
      ],
    },
  });
}

export const api = {
  get: (input: string, options?: Options) => createClient().get(input, options),
  post: (input: string, options?: Options) => createClient().post(input, options),
  put: (input: string, options?: Options) => createClient().put(input, options),
  delete: (input: string, options?: Options) => createClient().delete(input, options),
};
