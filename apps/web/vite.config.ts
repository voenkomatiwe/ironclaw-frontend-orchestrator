import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const target = env.VITE_ADDON_API_TARGET ?? "http://localhost:3000";

  return {
    plugins: [nodePolyfills(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": { target, changeOrigin: true },
        "/ws": { target, ws: true, changeOrigin: true },
      },
    },
  };
});
