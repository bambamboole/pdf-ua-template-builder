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

## Dark mode

The builder ships a dark theme built from the same semantic tokens. It turns on
automatically when the OS prefers dark (`prefers-color-scheme: dark`) and whenever
an ancestor element carries `data-theme="dark"` (or a `.dark` class) — so it syncs
with hosts like Starlight out of the box. Force a mode explicitly with
`data-theme="light"` or `data-theme="dark"` on a wrapper element:

```tsx
<div data-theme="dark">
  <TemplateBuilder apiUrl="http://localhost:8080" />
</div>
```

The editor page and the rendered-PDF preview stay light ("paper") in both themes,
matching the white PDF the backend produces.

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
