import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

declare const process: { env: Record<string, string | undefined> };

const proxyTarget = process.env.PDF_UA_API_PROXY_URL ?? "http://localhost:9999";

// Externalize every declared dependency and peer dependency (and their subpaths)
// so runtime deps are resolved from the consumer instead of bundled. Deriving the
// list from package.json keeps it from drifting as dependencies change.
const externalPackages = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
];

function isExternal(id: string): boolean {
  return externalPackages.some((name) => id === name || id.startsWith(`${name}/`));
}

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
          entryRoot: "src",
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
          external: isExternal,
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
