import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

declare const process: { env: Record<string, string | undefined> };

const proxyTarget = process.env.PDF_UA_API_PROXY_URL ?? "http://localhost:8080";

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  if (isLib) {
    return {
      plugins: [
        react(),
        dts({
          include: ["src/**/*"],
          exclude: ["**/*.test.*", "src/main.tsx", "src/App.tsx", "src/env.d.ts"],
          tsconfigPath: "./tsconfig.json",
        }),
      ],
      build: {
        lib: {
          entry: "src/index.ts",
          name: "PdfUaTemplateBuilder",
          formats: ["es"],
          fileName: () => "index.js",
        },
        cssCodeSplit: false,
        sourcemap: true,
        rollupOptions: {
          external: ["react", "react-dom", "react/jsx-runtime"],
          output: {
            assetFileNames: (asset) =>
              asset.names?.some((name) => name.endsWith(".css")) ? "style.css" : "[name][extname]",
          },
        },
      },
    };
  }

  return {
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: false,
      proxy: {
        "/schema": proxyTarget,
        "/render": proxyTarget,
      },
    },
  };
});
