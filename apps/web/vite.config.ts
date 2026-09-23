import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite configuration with environment variables support for port and proxy
export default defineConfig(({ mode }) => {
  const environmentVariables = loadEnv(mode, process.cwd(), "");
  const serverPort = Number(environmentVariables.VITE_PORT) || 3000;
  const proxyTarget = environmentVariables.VITE_API_PROXY_TARGET || "http://localhost:8125";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: serverPort,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
