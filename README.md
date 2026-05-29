# @bambamboole/pdf-ua-template-builder

A drag-and-drop React editor for designing accessible **PDF/UA** documents. Lay out
blocks on a real page, wire in your data, and render an accessibility-tagged PDF
through the [pdf-ua-api](https://github.com/bambamboole/pdf-ua-api) backend.

The component is the authoring surface; the API owns the compliant rendering
pipeline. Nothing PDF/UA-sensitive happens in the browser.

## Why it exists

Hand-writing a PDF/UA template JSON is tedious and easy to get wrong. This builder
gives you a what-you-see-is-what-you-get canvas that always stays inside what the
backend schema actually supports — so the template you design is the template that
renders.

## What you can build

- **Eight block types** — heading, text, HTML, image, table, key-value, spacer, and divider.
- **Multi-column rows** with draggable column resizing, so blocks sit side by side.
- **Page-aware canvas** for A3 / A4 / A5 / A6 / Letter / Legal / Tabloid in either orientation.
- **Repeating footers and page numbers** controlled directly on the page.
- **Focused inspectors** for content, layout, typography, and spacing, plus a document-settings panel.
- **Live PDF preview** rendered by the backend from the exact template and data you see.

Editing is fully keyboard- and screen-reader-accessible: drag-and-drop is powered by
[dnd-kit](https://dndkit.com), and the UI is built on semantic, re-themeable CSS tokens.

## Install

```bash
npm install @bambamboole/pdf-ua-template-builder react react-dom
```

React 18 or 19 is required as a peer dependency.

## Quick start

```tsx
import { TemplateBuilder, createInvoiceExample } from "@bambamboole/pdf-ua-template-builder";
import "@bambamboole/pdf-ua-template-builder/style.css";

const example = createInvoiceExample();

export default function App() {
  return (
    <TemplateBuilder
      apiUrl="http://localhost:8080"
      initialTemplate={example.template}
      initialData={example.data}
      onChange={(template, data) => console.log("changed", template, data)}
      onRendered={(pdf) => console.log("rendered pdf blob", pdf)}
    />
  );
}
```

`createInvoiceExample()` returns a ready-made invoice template and matching data —
a useful starting point and a quick way to see the builder fully populated.

## Props

| Prop              | Type                                                          | Description                                                              |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `apiUrl`          | `string`                                                     | Base URL of a running `pdf-ua-api`. Defaults to `""` (relative / proxy). |
| `initialTemplate` | `Template`                                                   | Template loaded into the editor on first render.                        |
| `initialData`     | `TemplateData`                                              | Runtime data keyed by block id (table rows, key-value overrides).       |
| `onChange`        | `(template: Template, data: TemplateData) => void`          | Fires on every edit, with the serialized template and data.             |
| `onRendered`      | `(pdf: Blob) => void`                                       | Fires after a successful render.                                        |
| `className`       | `string`                                                    | Appended to the root element.                                          |

## How rendering works

The component talks to a `pdf-ua-api` instance over two endpoints:

- `GET {apiUrl}/schema` — block metadata that drives the palette and inspector forms.
- `POST {apiUrl}/render/template` — turns the current template and data into a PDF blob.

The schema is the source of truth: only block types and options the backend
understands are offered in the UI. See the
[pdf-ua-api](https://github.com/bambamboole/pdf-ua-api) repo for installation and
configuration.

## Helpers

The package also exports the framework-agnostic pieces that power the builder:

```ts
import {
  pageSizeForFormat,   // [widthMm, heightMm] for a PageFormat + Orientation
  mmToPx,              // mm → CSS px at 96 DPI
  createEditorModel,   // ingest a Template into the editor model
  serializeTemplate,   // emit a Template from the editor model
  getPageSize, setPageSize,
  getFooterRepeat, setFooterRepeat,
  getPageNumbers, setPageNumbers,
  fetchTemplateSchema, renderTemplatePdf,
} from "@bambamboole/pdf-ua-template-builder";
```

Generated `Template`, `Block`, and related schema types are re-exported as well,
so consumers can type their own templates against the same contract.

## Local development

```bash
npm run dev          # starts pdf-ua-api via Docker Compose, then Vite on :5174
npm run build        # builds the npm package into dist/
npm run build:app    # builds the standalone playground app
npm run test         # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # oxlint
npm run fmt          # oxfmt
```

`npm run dev` spins up the backend (`bambamboole/pdf-ua-api` on port 9999) with
Docker Compose and proxies `/schema` and `/render/*` to it. Point Vite at a
different backend with `PDF_UA_API_PROXY_URL`.

The `schemas/` and `src/types/generated/` artifacts are derived from `pdf-ua-api`;
refresh them with `npm run sync:schema` and `npm run generate:types`.

## License

MIT — see [LICENSE](./LICENSE).
