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
          // Subpath entries let consumers import a single feature (e.g. the builder
          // without CodeMirror). Entry keys carry the `dir/index` shape so emitted JS
          // sits next to the matching `.d.ts` that vite-plugin-dts writes per source.
          entry: {
            index: "src/index.ts",
            "builder/index": "src/builder/index.ts",
            "editor/index": "src/editor/index.ts",
            "html-editor/index": "src/html-editor/index.ts",
          },
          formats: ["es"],
        },
        cssCodeSplit: false,
        sourcemap: true,
        rollupOptions: {
          external: isExternal,
          output: {
            entryFileNames: "[name].js",
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
        "/openapi.json": proxyTarget,
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
