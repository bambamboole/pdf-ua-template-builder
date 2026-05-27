# PDF/UA Template Builder

Standalone React frontend for building templates that render through `pdf-ua-api`.

## Scripts

- `npm run dev` starts Vite on port `5174`.
- `npm run build` runs TypeScript and builds the Vite app.
- `npm run sync:schema` copies the backend-owned template schema from `../pdf-ua-api`.
- `npm run generate:types` regenerates TypeScript declarations from `schemas/template.schema.json`.
- `npm run typecheck` runs TypeScript only.
- `npm run lint` runs oxlint.
- `npm run fmt` runs oxfmt.

Set `VITE_PDF_UA_API_URL` when the API is not running at `http://localhost:8080`.

## Current Scope

This is initial boilerplate with a direct API client for `/schema` and `/render/template`.
The full builder UI should be ported from `../pdf-ua-client/resources/js/builder` after the API template schema and frontend model are reconciled.

## Generated Types

The template schema is owned by `pdf-ua-api` and exposed at `/schema/template.json`.
Regenerate frontend declarations after backend schema changes:

```sh
npm run sync:schema
npm run generate:types
```
