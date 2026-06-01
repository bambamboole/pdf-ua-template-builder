import "./styles/app.css";

// Feature surfaces are defined in per-feature barrels so they can also be imported
// via the `./builder`, `./editor`, and `./html-editor` subpaths without pulling the
// other features (and their deps, e.g. CodeMirror) through this aggregate entry.
export * from "./builder";
export * from "./editor";
export * from "./html-editor";

export { Preview } from "./render/Preview";
export type { PreviewProps } from "./render/Preview";

export {
  fetchTemplateSchema,
  renderTemplatePdf,
  renderHtmlPdf,
  resolveDefaultApiUrl,
} from "./api/pdfUaApi";
export type { ConvertHtmlRequest } from "./api/pdfUaApi";
export type { TemplateData, TemplateSchemaResponse } from "./types/template";
export type {
  Align,
  Block,
  HeadingBlock,
  ImageBlock,
  KeyValueBlock,
  Orientation,
  PageConfig,
  PageFormat,
  PageSize,
  Row,
  SpacerBlock,
  TableBlock,
  Template,
  TextBlock,
} from "./types/generated/template";
