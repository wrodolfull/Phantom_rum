import {defineConfig} from "vite";
export default defineConfig({
  // Works both at domain root and at /Phantom_rum/ on GitHub Pages.
  base:"./",
  build:{target:"es2022"}
});
