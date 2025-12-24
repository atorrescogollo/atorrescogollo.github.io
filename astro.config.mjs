// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://atorrescogollo.github.io",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      customPages: ["https://atorrescogollo.github.io/cv.pdf"],
    }),
  ],
});
