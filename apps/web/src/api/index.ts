import ky from "ky";
import { useAppStore } from "@/store/app";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = ky.create({
  prefixUrl: `${API_URL}`,
  timeout: 15000,
  retry: { limit: 2, statusCodes: [408, 429, 502, 503, 504] },
  hooks: {
    beforeRequest: [
      (req) => {
        const t = useAppStore.getState().token;
        if (t) req.headers.set("Authorization", `Bearer ${t}`);
      },
    ],
  },
});
