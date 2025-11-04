import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/Mermaid.tsx"],
  format: ["cjs", "esm"],
  target: "node18",
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  outDir: "dist",
});
