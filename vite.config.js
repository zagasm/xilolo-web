import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/", // Ensures assets are loaded from root in production
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Ensure proper asset handling
    rollupOptions: {
      output: {
        /* Vendor splitting, deliberately MINIMAL.
           Only react/react-dom/scheduler/react-router are forced into one chunk: they
           must initialise together (splitting a renderer from its scheduler is the
           classic cross-chunk order bug) and they change rarely, so they are worth
           caching separately.

           Everything ELSE returns undefined on purpose — i.e. Rollup decides. The first
           attempt at this file used a catch-all `vendor` bucket, which measured badly:
           the bucket merged unrelated libraries, so an eager dependency (axios) dragged
           in libraries only lazy routes need (the Didit KYC SDK, react-player, hls.js,
           bootstrap, zod) as one 1.66 MB first-load chunk — silently undoing the
           route-level lazy() imports in src/app.jsx. Letting Rollup place modules
           per-importer is what actually keeps a page's heavy deps in that page's chunk. */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return "vendor-react";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "https://api.xilolo.com",
        changeOrigin: true,
        secure: true,
        // Optional: if the upstream checks Origin, pretend to be the allowed site
        headers: { Origin: "https://xilolo.com" },
      },
      /* Laravel's broadcast channel authorization. NOT under /api, so it needs
         its own entry or the host live console cannot open its realtime channel
         locally (`private-live-event.{id}` authenticates here, verified
         2026-10-02). Dev-only: production talks to api.xilolo.com directly. */
      "/broadcasting": {
        target: "https://api.xilolo.com",
        changeOrigin: true,
        secure: true,
        headers: { Origin: "https://xilolo.com" },
      },
      "/media": {
        target: "https://api.xilolo.com",
        changeOrigin: true,
        secure: true,
        // rewrite your local path to the real one
        // e.g. /media/storage/audio/...  ->  /storage/audio/...
        rewrite: (path) => path.replace(/^\/media/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Force open CORS for dev
            proxyRes.headers["access-control-allow-origin"] = "*";
            proxyRes.headers["access-control-allow-credentials"] = "true";
            proxyRes.headers["access-control-allow-headers"] =
              "Origin, X-Requested-With, Content-Type, Accept, Range";
          });
        },
      },
    },
  },

  resolve: {
    dedupe: ["react", "react-dom"],
    // alias: {
    //   react: "preact/compat",
    //   "react-dom": "preact/compat",
    // },
  },
});
