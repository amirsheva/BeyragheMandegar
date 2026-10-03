import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function blockAdminOnPublicDev() {
  return {
    name: "block-admin-on-public-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (url === "/admin" || url.startsWith("/admin/")) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Admin dev server is available at http://localhost:5174/admin/");
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react(), blockAdminOnPublicDev()],
    server: {
      port: 5173,
      strictPort: true,
      watch: { ignored: ["**/dist-admin/**"] },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
