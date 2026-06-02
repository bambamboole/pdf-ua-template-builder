# @bambamboole/pdf-ua-template-builder

Embeddable React components for authoring
[pdf-ua-api](https://github.com/bambamboole/pdf-ua-api) PDF/UA templates — a
visual drag-and-drop **builder** and a schema-validated **JSON editor**, each
with a live rendered-PDF preview.

- **Visual builder** — hybrid block cards that expand inline for editing
- **JSON editor** — CodeMirror with schema-aware autocomplete, validation, and hover
- Page-format aware canvas (A3/A4/A5/A6/Letter/Legal/Tabloid + orientation)
- Repeated footer area and page-number controls
- Animated drag-and-drop with full keyboard accessibility (powered by dnd-kit)
- Light/dark theming and composable provider + parts, built on CSS custom properties

## Install

```bash
npm install @bambamboole/pdf-ua-template-builder
```

React 18 or 19 is required as a peer dependency:

```bash
npm install react react-dom
```

## Usage

```tsx
import { TemplateBuilder, createInvoiceExample } from "@bambamboole/pdf-ua-template-builder";
import "@bambamboole/pdf-ua-template-builder/style.css";

export default function App() {
  return (
    <TemplateBuilder
      apiUrl="http://localhost:8080"
      examples={{ Invoice: createInvoiceExample() }}
      onChange={(template, data) => console.log("changed", template, data)}
      onRendered={(pdf) => console.log("rendered pdf blob", pdf)}
    />
  );
}
```

## Props

| Prop              | Type                                                          | Description                                                                   |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `apiUrl`          | `string`                                                     | Base URL of a running `pdf-ua-api`. Defaults to `""` (relative URL / proxy).  |
| `initialTemplate` | `Template`                                                   | Template loaded on first render.                                              |
| `initialData`     | `Record<string, unknown>`                                    | Runtime data keyed by block id (table rows, dynamic key-value overrides).     |
| `examples`        | `Record<string, { template: Template; data?: TemplateData }>` | Loadable examples keyed by display name. The palette's Load control only appears when this is non-empty. |
| `onChange`        | `(template: Template, data: Record<string, unknown>) => void` | Fires on every edit.                                                          |
| `onRendered`      | `(pdf: Blob) => void`                                        | Fires after a successful render.                                              |
| `className`       | `string`                                                     | Class appended to the root element.                                           |

## Composable layout

`<TemplateBuilder />` is a preset that places a `Builder` and a `Preview`
side-by-side. When you need a different arrangement — for example the PDF
preview **below** the builder inside a docs page — compose the parts yourself.
`TemplateBuilderProvider` owns the shared state and drag-and-drop context; place
`Builder` and `Preview` inside it however you like. Both accept a `className` for
positioning and sizing:

```tsx
import {
  TemplateBuilderProvider,
  Builder,
  Preview,
  createInvoiceExample,
} from "@bambamboole/pdf-ua-template-builder";
import "@bambamboole/pdf-ua-template-builder/style.css";

export default function StackedBuilder() {
  return (
    <TemplateBuilderProvider apiUrl="http://localhost:8080">
      <div className="flex flex-col gap-3">
        <Builder examples={{ Invoice: createInvoiceExample() }} className="h-[36rem]" />
        <Preview className="h-[40rem]" />
      </div>
    </TemplateBuilderProvider>
  );
}
```

`Builder` groups the palette, canvas, and inspector; `Preview` shows the rendered
PDF and the Render button. `TemplateBuilderProvider` accepts the same props as
`<TemplateBuilder />` except `examples` and `className` (`apiUrl`,
`initialTemplate`, `initialData`, `onChange`, `onRendered`). Because the provider
does not impose a height, give `Builder` and `Preview` explicit sizes when you
are not filling the viewport. For fully custom parts, the `useTemplateBuilder()`
hook exposes the underlying state and actions.

## JSON editor

Prefer raw JSON? `TemplateEditor` is a drop-in alternative to `TemplateBuilder`:
a CodeMirror editor with schema-aware autocomplete, validation, and hover (driven
by the bundled template JSON Schema), paired with the same rendered-PDF preview.

```tsx
import { TemplateEditor, createInvoiceExample } from "@bambamboole/pdf-ua-template-builder";
import "@bambamboole/pdf-ua-template-builder/style.css";

const example = createInvoiceExample();

export default function App() {
  return (
    <TemplateEditor
      apiUrl="http://localhost:8080"
      initialTemplate={example.template}
      data={example.data}
      onChange={(template, text) => console.log("edited", template, text)}
      onRendered={(pdf) => console.log("rendered pdf blob", pdf)}
    />
  );
}
```

The editor owns the JSON text; `data` is passed straight through to render.
`onChange(template, text)` fires on every edit — `template` is `null` while the
JSON is invalid, and Render is disabled until it parses. Schema problems surface
as inline editor diagnostics.

It composes exactly like the builder, and shares the same `Preview`:

```tsx
import { TemplateEditorProvider, CodeEditor, Preview } from "@bambamboole/pdf-ua-template-builder";

<TemplateEditorProvider apiUrl="http://localhost:8080" initialTemplate={example.template}>
  <div className="flex flex-col gap-3">
    <CodeEditor className="h-[36rem]" />
    <Preview className="h-[40rem]" />
  </div>
</TemplateEditorProvider>
```

`useTemplateEditor()` exposes the text and parsed state (`{ text, setText,
template, error, data }`) for custom UIs.

## Dark mode

The builder and editor ship a dark theme built from the same semantic tokens. It
turns on automatically when the OS prefers dark (`prefers-color-scheme: dark`) and
whenever an ancestor element carries `data-theme="dark"` (or a `.dark` class) — so
it syncs with hosts like Starlight out of the box. Force a mode explicitly with
`data-theme="light"` or `data-theme="dark"` on a wrapper element:

```tsx
<div data-theme="dark">
  <TemplateBuilder apiUrl="http://localhost:8080" />
</div>
```

The on-canvas page and the rendered-PDF preview stay light ("paper") in both
themes, matching the white PDF the backend produces.

## Backend

The component talks to a `pdf-ua-api` instance via:

- `GET {apiUrl}/openapi.json` — the builder extracts `components.schemas.Template`
  for block metadata used by the palette and forms.
- `POST {apiUrl}/render/template` — to render the current template + data into a PDF blob.
- `POST {apiUrl}/render/html` — to render raw HTML into a PDF blob.

See the [pdf-ua-api](https://github.com/bambamboole/pdf-ua-api) repository for
installation and configuration. The component does **not** render PDFs in the
browser — the backend owns the PDF/UA-accurate rendering pipeline.

## Helpers

The package also exports framework-agnostic utilities:

```ts
import {
  pageSizeForFormat,   // [widthMm, heightMm] for a PageFormat + Orientation
  mmToPx,              // mm → CSS px at 96 DPI
  createEditorModel,   // ingest a Template into an editor model
  serializeTemplate,   // emit a Template from an editor model
  getPageSize, setPageSize,
  getFooterRepeat, setFooterRepeat,
  getPageNumbers, setPageNumbers,
} from "@bambamboole/pdf-ua-template-builder";
```

## Local development

```bash
npm install
npm run dev          # runs the playground app on http://localhost:5174
npm run build        # produces the npm package in dist/
npm run build:app    # produces the playground build
npm run test         # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # oxlint
```

`npm run dev` starts the Compose backend and serves the Vite app. Set
`VITE_PDF_UA_API_URL` to point the app at a different `pdf-ua-api`
(default: `http://localhost:9999`; proxy fallback override: `PDF_UA_API_PROXY_URL`).

## License

MIT
