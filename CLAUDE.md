# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Snapshot

- Standalone Vite 8 + React 19 + TypeScript frontend for building PDF/UA templates.
- Styled with Tailwind CSS v4 (see Styling). Built both as an app and as a component library (`vite build --mode lib`).
- Runtime backend is `../pdf-ua-api`, expected locally at `http://localhost:8080` unless `VITE_PDF_UA_API_URL` is set.
- The backend owns the template rendering contract. Treat `schemas/template.schema.json` and `src/types/generated/template.d.ts` as generated artifacts derived from `pdf-ua-api`.
- The builder lives under `src/builder/` (`TemplateBuilder.tsx` and `Builder.tsx` plus `canvas/`, `inspector/`, `preview/`, `blocks/`, `controls/`, `context/`, `state/`, `schema/`); `src/index.ts` re-exports it as the library entry.

## Important Paths

- `src/api/pdfUaApi.ts`: fetch wrapper for `GET /schema` and `POST /render/template`.
- `src/builder/TemplateBuilder.tsx`: all-in-one preset composing a `Builder` (palette + canvas + inspector) and a `Preview` side by side.
- `src/builder/context/BuilderContext.tsx`: `TemplateBuilderProvider`, split into a stable actions context and a state context; `useTemplateBuilder` merges both as the headless escape hatch.
- `src/builder/`: builder feature code — `canvas/`, `inspector/` (with `inspector/editors/` block editors), `preview/`, `blocks/`, `controls/` (shared form primitives), `context/`, `state/` (editor model + serialization), `schema/` (schema adapter + example), `lib/`.
- `src/index.ts`: library entry re-exporting `TemplateBuilder` and editor/schema/API helpers.
- `src/styles/app.css`: Tailwind v4 entry and the semantic theme tokens (see Styling).
- `src/types/template.ts`: local API-facing type aliases around generated schema types.
- `src/types/generated/template.d.ts`: generated TypeScript declarations. Do not hand-edit.
- `schemas/template.schema.json`: backend-owned JSON Schema copied from `../pdf-ua-api`.
- `../pdf-ua-api/app/src/main/kotlin/bambamboole/pdf/api/routes`: source for current backend endpoint behavior.
- `../pdf-ua-api/app/src/main/kotlin/bambamboole/pdf/api/models/template`: source for backend template model and schema generation.

## Common Commands

- `npm run dev`: start Vite. The configured port is `5174`, with fallback if busy.
- `npm run build`: run `tsc --noEmit` and build the Vite app.
- `npm run typecheck`: TypeScript only.
- `npm run lint`: oxlint.
- `npm run lint:fix`: oxlint autofix.
- `npm run fmt`: oxfmt.
- `npm run fmt:check`: formatting check.
- `npm run sync:schema`: copy the backend-owned template schema from `../pdf-ua-api`.
- `npm run generate:types`: regenerate `src/types/generated/template.d.ts` from `schemas/template.schema.json`.

## Backend Contract

- Default backend URL: `http://localhost:8080`.
- API base URL should come from `import.meta.env.VITE_PDF_UA_API_URL ?? "http://localhost:8080"`.
- Current frontend wrapper calls:
  - `GET /schema` for compact runtime metadata.
  - `POST /render/template` with `{ template, data, options }` for PDF Blob rendering.
- Keep request and response parsing centralized in `src/api/pdfUaApi.ts`; do not scatter raw `fetch` calls across UI components.
- If `pdf-ua-api` runs with `API_KEY`, add auth support deliberately through the API wrapper and environment config.
- The backend renders authoritative PDFs. Do not recreate compliance-sensitive PDF/UA behavior in the browser.

## Editor Model And Schema

- Editor-only fields such as `uid`, `gap`, `footerRows`, and layered data stay internal to the editor model. Serialize only the backend template shape plus separate `data` (`serializeTemplate` in `src/builder/state/editorModel.ts`).
- Hide or gate UI for block types and features that the backend schema does not currently support.
- Preview PDFs through `POST /render/template`; there is no authoritative in-browser HTML preview unless the backend adds a dedicated endpoint.

## TypeScript And React

- Keep `strict` TypeScript clean. Avoid `any`; prefer `unknown`, generated schema types, discriminated unions, and narrow helper functions.
- Preserve generated types by wrapping them in local adapter types instead of editing `src/types/generated/template.d.ts`.
- Use direct imports instead of broad barrel imports when it helps bundle size and clarity.
- Keep component state local until shared state is necessary. Move editor transformations into pure functions under focused modules so they can be tested.
- For expensive derived data, use `useMemo`; for stable event callbacks passed deep into the tree, use `useCallback` or a `useLatest` style helper where it avoids dependency churn.
- Start independent async work in parallel with `Promise.all` when adding multiple API reads.
- Use functional `setState` when next state depends on current state.
- Clean up object URLs, subscriptions, timers, and global event listeners in effects.
- Prefer accessible native controls and semantic labels for the builder. Drag-and-drop must keep keyboard and screen-reader behavior provided by dnd-kit intact.

## Styling

- This project styles with Tailwind CSS v4, wired through `@tailwindcss/vite` in `vite.config.ts`. There is no `tailwind.config.js`; theme config is CSS-first in `src/styles/app.css`.
- Style with utility classes in JSX. Use the semantic color tokens (`bg-surface`, `bg-surface-muted`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-border`, `text-accent`, `bg-danger-soft`, …), the `text-2xs` size, and the named shadows (`shadow-page`, `shadow-pop`, `drop-shadow-drag`) instead of hardcoded palette values, so the UI stays re-themeable.
- Semantic tokens are backed by `--pdfua-*` CSS variables on `:root`. Re-theme by overriding those variables (globally or scoped to a wrapper element), not by rewriting utility classes everywhere.
- Do not introduce a component library or another CSS framework. Match the existing utility patterns before inventing new ones.
- Builder UI should be dense, work-focused, and predictable. Favor clear panes, toolbars, tabs, inspectors, and stable canvas dimensions over marketing-style layouts.

## Testing Expectations

- Add Vitest tests for pure editor model changes, schema adapters, data transforms, and specialized controls.
- For API wrapper changes, test success and error parsing with mocked `fetch` where practical.
- For visual builder behavior, prefer focused component tests over broad rewrites.
- Run the narrowest useful command while iterating, then run at least `npm run typecheck` and `npm run lint` before claiming completion. Run `npm run build` for changes affecting bundling, schema generation, or public UI behavior.
- When schema changes come from `../pdf-ua-api`, run `npm run sync:schema` and `npm run generate:types`, then verify typecheck.

## Comments

- Code should be self-explanatory through clear names, small functions, and types before comments.
- Do not add comments unless they explain why a non-obvious decision exists; never add comments that restate what the code does.
- Remove obsolete, redundant, or misleading comments when editing nearby code.

## Git Hygiene

- This directory may not be a git repository on its own. Check before assuming git commands work.
- Do not revert unrelated local changes.
- Do not change dependencies, build tooling, TypeScript config, or formatter/linter setup without explicit need.
- Never credit the agent in commits or PRs. Do not add `Co-Authored-By` trailers or "generated by" attribution.
- Keep changes scoped to the requested behavior and mention verification commands that were not run.
