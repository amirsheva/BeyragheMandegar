import { defineConfig } from "vite";
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
          res.end("Admin panel is available at http://localhost:4000/admin/");
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), blockAdminOnPublicDev()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
