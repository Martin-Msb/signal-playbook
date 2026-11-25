import { defineConfig } from "astro/config";

export default defineConfig({
  build: { inlineStylesheets: "always" },
  redirects: { "/sources": "/map", "/references": "/map" },
  vite: { ssr: { noExternal: ["@signal-path/engine"] } },
});
