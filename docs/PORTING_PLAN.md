# Porting Plan

## Goal

Move the React template builder from `../pdf-ua-client` into this standalone package so it talks directly to `pdf-ua-api`, without Laravel, Inertia, PHP schema export commands, or PHP-side rendering helpers.

## Can Be Ported Mostly As-Is

- Builder UI components from `../pdf-ua-client/resources/js/builder`:
  - `TemplateBuilder`, `BlockPalette`, `EditCanvas`, `PageCanvas`, `PdfCanvas`, data editors, settings panels, and RJSF templates.
- Generated TypeScript declarations:
  - Use `json-schema-to-typescript` through `npm run generate:types` instead of hand-maintaining template DTO types.
- Frontend-only model utilities:
  - `state/templateModel.ts`, `state/builderActions.ts`, `lib/displayScale.ts`, `lib/pageSizes.ts`, `lib/columns.ts`, `lib/imageUpload.ts`, and `useLatest.ts`.
- Tests that cover pure frontend behavior:
  - Component tests and utility tests can move to Vitest with small import path updates.
- Runtime dependencies:
  - dnd-kit, RJSF, AJV, React, and React DOM stay relevant.

## Needs API-Aware Reimplementation

- Schema loading:
  - Use the backend-owned JSON Schema exposed by `GET /schema/template.json` as the type-generation source.
  - Keep `GET /schema` for compact runtime metadata, bundled fonts, and block palette hints.
- Rendering:
  - Replace `renderTemplate` HTML previews with API-backed flows. The API currently exposes PDF rendering at `POST /render/template`; it does not expose raw rendered HTML.
  - PDF preview should call `POST /render/template` and render the returned Blob.
- Data schema generation:
  - The client has data-schema utilities that assume richer block metadata. Either expose matching metadata from `pdf-ua-api` or derive a smaller frontend schema from `/schema`.
- Examples:
  - Replace Storybook fixture loading with local examples in this package or API-provided examples if we add an endpoint later.
- Auth and deployment:
  - Add optional API-key headers if `pdf-ua-api` runs with `API_KEY`.
  - Decide whether this package is only a standalone app or also built into the Ktor web UI assets.

## Must Be Reconciled Before Full Port

- Block coverage differs:
  - The client builder includes heading, image, key-value, table, footer rows, and richer page settings.
  - The current API schema advertises text, html, spacer, and divider, while API model code already contains some additional block types. The source of truth should be made consistent before the UI exposes unsupported controls.
- Template shape differs:
  - Client rows include editor-only fields such as `gap`, generated `uid`, `footerRows`, and layered data.
  - API templates use `version`, `config`, `fonts`, `attachments`, and `rows`, with request data passed separately as `data`.
- HTML preview differs:
  - The old builder expects a rendered HTML preview. Direct API mode either needs a new HTML preview endpoint or a client-side preview renderer that is clearly non-authoritative.

## Proposed Migration Sequence

1. Keep this package standalone and verify the boilerplate can fetch `/schema` and render a basic PDF through `pdf-ua-api`.
2. Copy pure types, model utilities, and focused tests from `../pdf-ua-client/resources/js/builder`.
3. Add an adapter layer that converts the API template schema into the UI metadata expected by the builder.
4. Port visual builder components behind that adapter, starting with text, html, spacer, and divider only.
5. Add API support or hide UI for heading, image, key-value, table, footer rows, and HTML preview until the API contract supports them.
6. Add optional auth configuration and package-level examples.
7. Decide integration mode:
   - keep as separate frontend app for development and embedding, or
   - build the Vite output into Ktor resources for the built-in web UI.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Manual smoke test with `pdf-ua-api` running:
  - load schema from `http://localhost:8080/schema`
  - render the starter template through `POST /render/template`
