# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Snapshot

- Standalone Vite + React 19 + TypeScript frontend for building PDF/UA templates.
- Successor to `../pdf-ua-client`'s Laravel workbench builder, but this repo is not a Laravel, Inertia, Tailwind, PHP, or Boost project.
- Runtime backend is `../pdf-ua-api`, expected locally at `http://localhost:8080` unless `VITE_PDF_UA_API_URL` is set.
- The backend owns the template rendering contract. Treat `schemas/template.schema.json` and `src/types/generated/template.d.ts` as generated artifacts derived from `pdf-ua-api`.
- Current UI is starter boilerplate in `src/components/TemplateBuilderShell.tsx`; the full builder should be ported from `../pdf-ua-client/resources/js/builder` through an API-aware adapter.

## Important Paths

- `src/api/pdfUaApi.ts`: fetch wrapper for `GET /schema` and `POST /render/template`.
- `src/components/TemplateBuilderShell.tsx`: temporary starter UI and smoke-test surface.
- `src/types/template.ts`: local API-facing type aliases around generated schema types.
- `src/types/generated/template.d.ts`: generated TypeScript declarations. Do not hand-edit.
- `schemas/template.schema.json`: backend-owned JSON Schema copied from `../pdf-ua-api`.
- `docs/PORTING_PLAN.md`: migration notes for moving builder code from `../pdf-ua-client`.
- `../pdf-ua-client/resources/js/builder`: source for portable builder components, state utilities, RJSF templates, dnd-kit usage, and frontend tests.
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

## Porting Rules

- Port from `../pdf-ua-client/resources/js/builder` only after checking current source and tests there.
- Portable pieces include React builder components, state/model utilities, RJSF templates, dnd-kit patterns, image helpers, page sizing helpers, and pure frontend Vitest tests.
- Do not copy Laravel workbench adapters directly. Replace `/html`, `/pdf`, CSRF, Inertia page props, Storybook fixture loading, and PHP schema commands with API-backed code for this repo.
- Old builder types may contain editor-only fields such as `uid`, `gap`, `footerRows`, and layered data. Keep those internal to the editor model and serialize only the backend template shape plus separate `data`.
- Hide or gate UI for block types and features that the backend schema does not currently support.
- The old HTML preview is not authoritative here. Use PDF preview through `POST /render/template` unless the backend adds a dedicated HTML preview endpoint.

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

- This project currently uses plain CSS in `src/styles/app.css`.
- Do not introduce Tailwind, Inertia, a component library, or a CSS framework unless explicitly requested or required by the task.
- Match existing CSS structure before creating new styling patterns.
- Builder UI should be dense, work-focused, and predictable. Favor clear panes, toolbars, tabs, inspectors, and stable canvas dimensions over marketing-style layouts.

## Testing Expectations

- Add or port Vitest tests for pure editor model changes, schema adapters, data transforms, and specialized controls.
- For API wrapper changes, test success and error parsing with mocked `fetch` where practical.
- For visual builder behavior, port existing focused component tests before broad rewrites.
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
