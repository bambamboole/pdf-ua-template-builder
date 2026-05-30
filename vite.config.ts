import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

declare const process: { env: Record<string, string | undefined> };

const proxyTarget = process.env.PDF_UA_API_PROXY_URL ?? "http://localhost:9999";

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  if (isLib) {
    return {
      plugins: [
        tailwindcss(),
        react(),
        dts({
          include: ["src/**/*"],
          exclude: ["**/*.test.*", "src/test/**", "src/main.tsx", "src/App.tsx", "src/env.d.ts"],
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
    plugins: [tailwindcss(), react()],
    server: {
      port: 5174,
      strictPort: false,
      proxy: {
        "/schema": proxyTarget,
        "/render": proxyTarget,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      exclude: [...configDefaults.exclude, "e2e/**"],
    },
  };
});
