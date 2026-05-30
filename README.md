# @bambamboole/pdf-ua-template-builder

An embeddable React template builder for the
[pdf-ua-api](https://github.com/bambamboole/pdf-ua-api) PDF/UA renderer.

- Hybrid block cards that expand inline for editing
- Page-format aware canvas (A3/A4/A5/A6/Letter/Legal/Tabloid + orientation)
- Repeated footer area and page-number controls
- Animated drag-and-drop with full keyboard accessibility (powered by dnd-kit)
- Lightweight neutral UI built around CSS custom properties

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

## Props

| Prop              | Type                                                                | Description                                                                  |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apiUrl`          | `string`                                                            | Base URL of a running `pdf-ua-api`. Defaults to `""` (relative URL / proxy). |
| `initialTemplate` | `Template`                                                          | Template loaded on first render.                                             |
| `initialData`     | `Record<string, unknown>`                                           | Runtime data keyed by block id (table rows, dynamic key-value overrides).   |
| `onChange`        | `(template: Template, data: Record<string, unknown>) => void`       | Fires on every edit.                                                         |
| `onRendered`     | `(pdf: Blob) => void`                                               | Fires after a successful render.                                             |
| `className`      | `string`                                                            | Class appended to the root element.                                          |

## Composable layout

`TemplateBuilder` is a preset that arranges every pane in a fixed, full-screen
two-column layout. When you need a different arrangement — for example the PDF
preview **below** the authoring area inside a docs page — compose the panes
yourself. Wrap them in a single `TemplateBuilderProvider` (which owns the shared
state and drag-and-drop context) and place the slots however you like. Each slot
accepts a `className` for positioning and sizing:

```tsx
import {
  TemplateBuilderProvider,
  TemplateBuilderToolbar,
  TemplateBuilderPalette,
  TemplateBuilderCanvas,
  TemplateBuilderInspector,
  TemplateBuilderPreview,
} from "@bambamboole/pdf-ua-template-builder";
import "@bambamboole/pdf-ua-template-builder/style.css";

export default function StackedBuilder() {
  return (
    <TemplateBuilderProvider apiUrl="http://localhost:8080">
      <div className="flex flex-col gap-3">
        <TemplateBuilderToolbar />
        <TemplateBuilderPalette />
        <div className="grid grid-cols-[minmax(320px,360px)_1fr]">
          <TemplateBuilderInspector className="border-r border-solid border-border" />
          <TemplateBuilderCanvas className="h-[36rem]" />
        </div>
        <TemplateBuilderPreview className="h-[40rem]" />
      </div>
    </TemplateBuilderProvider>
  );
}
```

`TemplateBuilderProvider` accepts the same props as `TemplateBuilder` except
`className` (`apiUrl`, `initialTemplate`, `initialData`, `onChange`,
`onRendered`). Because the provider does not impose a height, give the canvas and
preview regions explicit sizes when you are not filling the viewport. For fully
custom panes, `useTemplateBuilderContext()` exposes the underlying state and
actions.

## Backend

The component talks to a `pdf-ua-api` instance via:

- `GET {apiUrl}/schema` — for block metadata used by the palette and forms.
- `POST {apiUrl}/render/template` — to render the current template + data into a PDF blob.

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

`npm run dev` proxies `/schema` and `/render/*` to a local `pdf-ua-api`
(default: `http://localhost:8080`, override with `PDF_UA_API_PROXY_URL`).

## License

MIT
