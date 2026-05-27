# AGENTS.md

Instructions for coding agents working in this repository.

## Project Snapshot

- This is a standalone React 19, TypeScript 5.9, Vite 7 frontend for PDF/UA template building.
- It talks directly to `pdf-ua-api`, normally running at `http://localhost:8080`.
- It succeeds the builder that lives in `../pdf-ua-client`, but it should not inherit Laravel, Inertia, Tailwind, Pest, Boost, or PHP package rules from that project.
- Backend schema and rendering behavior are owned by `../pdf-ua-api`. Frontend code should adapt to that contract, not fork it.

## Repository Map

- `src/api/pdfUaApi.ts`: centralized API client for schema loading and PDF rendering.
- `src/components/TemplateBuilderShell.tsx`: current starter UI.
- `src/styles/app.css`: current plain CSS styling.
- `src/types/template.ts`: local public template/data/render types.
- `src/types/generated/template.d.ts`: generated declarations from JSON Schema. Do not edit by hand.
- `schemas/template.schema.json`: copied backend schema.
- `docs/PORTING_PLAN.md`: plan for porting the old builder.
- `../pdf-ua-client/resources/js/builder`: old portable React builder source and tests.
- `../pdf-ua-api`: Kotlin/Ktor backend and canonical API/schema implementation.

## Common Commands

- `npm run dev`: start Vite on port `5174` unless it falls back.
- `npm run typecheck`: run `tsc --noEmit`.
- `npm run lint`: run oxlint.
- `npm run lint:fix`: run oxlint autofix.
- `npm run fmt`: run oxfmt.
- `npm run fmt:check`: check formatting.
- `npm run build`: typecheck and build.
- `npm run sync:schema`: copy schema from `../pdf-ua-api/app/src/main/resources/schemas/template.schema.json`.
- `npm run generate:types`: regenerate TypeScript declarations from `schemas/template.schema.json`.

## Development Rules

- Check nearby files and the predecessor builder before adding new patterns.
- Keep API calls inside `src/api/pdfUaApi.ts` or a small API module beside it.
- Prefer generated template types and explicit adapters over duplicated hand-written DTOs.
- Do not edit generated files directly. Change the backend schema or generation flow, then regenerate.
- Keep editor-only fields internal. Persist or send only the backend template shape plus separate `data`.
- Do not expose UI for unsupported backend features unless it is clearly disabled or guarded by schema metadata.
- Do not introduce new dependencies without a clear reason and user approval.
- Avoid broad refactors while porting. Move one coherent slice at a time and keep tests focused.

## React And TypeScript Guidance

- Use strict TypeScript. Avoid `any`; use `unknown` plus narrowing, generated types, and small domain types.
- Keep pure template/editor transformations outside React components so Vitest can cover them.
- Use `useMemo` for expensive derived schema/editor data and `useCallback` for handlers passed to memoized children.
- Use functional state updates when the next value depends on current state.
- Revoke Blob object URLs and clean up effects.
- Fetch independent resources in parallel when adding multiple API reads.
- Avoid broad barrel imports for heavy libraries when direct imports are clearer and smaller.
- Preserve dnd-kit accessibility behavior when porting drag-and-drop from `pdf-ua-client`.

## API Contract

- Backend base URL: `VITE_PDF_UA_API_URL` or `http://localhost:8080`.
- Runtime metadata: `GET /schema`.
- PDF rendering: `POST /render/template` with JSON `{ template, data, options }`; response is `application/pdf`.
- Compact runtime schema metadata and full JSON Schema are different concerns. Use `GET /schema` for runtime hints and `schemas/template.schema.json` for generated TypeScript declarations.
- Add API-key support through a single wrapper path if the backend is configured with `API_KEY`.

## Porting From `pdf-ua-client`

- Good candidates to port: builder components, dnd-kit canvas behavior, RJSF templates, block editors, state utilities, `useLatest`, page-size helpers, image helpers, and frontend tests.
- Reimplement adapters that were Laravel-specific: Inertia page props, CSRF, `/html`, `/pdf`, Storybook fixture data, PHP schema export commands, and workbench routes.
- The old builder expects an HTML preview. This repo should use backend PDF rendering unless a backend HTML endpoint is added.
- Reconcile block coverage against the backend schema before exposing heading, image, key-value, table, footer rows, fonts, attachments, or page settings.

## Styling Guidance

- Current styling is plain CSS. Do not add Tailwind or another framework by default.
- Build the app as an operational editor: stable toolbar, panes, inspectors, tabs, canvas, and preview areas.
- Keep controls accessible and predictable. Use native form semantics where practical.
- Avoid decorative landing-page patterns; the first screen should be the working builder.

## Testing Guidance

- Port or add Vitest tests for schema adapters, editor model transforms, data-layer behavior, and component controls.
- Mock `fetch` for API wrapper behavior and error parsing.
- Run focused tests while iterating once tests exist.
- Before reporting completion, run `npm run typecheck` and `npm run lint`; run `npm run build` for UI, schema, or bundling changes.
- After syncing backend schema, run `npm run generate:types` and then `npm run typecheck`.

## Comments

- Prefer clear names, small functions, and explicit types over comments.
- Add comments only for non-obvious why-level decisions.
- Remove stale or restating comments when editing nearby code.

## Operational Notes

- This folder may not be a git repository. Verify before relying on git status or commits.
- Do not revert unrelated local changes.
- Keep documentation concise and repository-specific.
- Never credit the agent in commits or pull requests.
- State any verification command you could not run.
