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
          external: (id) =>
            id === "react" ||
            id === "react-dom" ||
            id === "react/jsx-runtime" ||
            id === "codemirror-json-schema" ||
            id.startsWith("@codemirror/") ||
            id.startsWith("@lezer/") ||
            id.startsWith("@uiw/"),
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
        // Anchored so it does not also catch the bundled `/schemas/...json` asset import.
        "^/schema$": proxyTarget,
        "/render": proxyTarget,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      exclude: [...configDefaults.exclude, "e2e/**"],
      server: {
        deps: {
          inline: ["codemirror-json-schema"],
        },
      },
    },
  };
});
