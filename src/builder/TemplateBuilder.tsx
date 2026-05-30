import type { Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { Palette } from "./blocks/Palette";
import { Canvas } from "./canvas/Canvas";
import { BuilderProvider, useTemplateBuilder } from "./context/BuilderContext";
import { Inspector } from "./inspector/Inspector";
import { Preview } from "./pdf/Preview";
import { Toolbar } from "./topbar/Toolbar";

export interface TemplateBuilderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template loaded into the editor on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id (table rows, dynamic key-value overrides). */
  initialData?: TemplateData;
  /** Fires whenever the user edits the template or its runtime data. */
  onChange?: (template: Template, data: TemplateData) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

function DefaultLayout({ className }: { className?: string }) {
  const { schema } = useTemplateBuilder();

  return (
    <main
      className={`grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible${className ? ` ${className}` : ""}`}
    >
      <section
        className="grid min-w-0 min-h-0 border-0 border-r border-solid border-border bg-app grid-cols-[minmax(320px,360px)_minmax(360px,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] max-[760px]:grid-cols-1"
        aria-label="Template authoring"
      >
        <Toolbar className="col-span-full" />

        <Palette className="col-span-full row-start-2 max-[760px]:col-span-1 max-[760px]:row-auto" />

        <Canvas
          className={
            schema
              ? "col-start-2 row-start-3 max-[760px]:col-start-1 max-[760px]:col-span-1 max-[760px]:row-auto"
              : "col-span-full row-start-3 max-[760px]:row-auto"
          }
        />

        <Inspector className="col-start-1 row-start-3 border-0 border-r border-solid border-border max-[760px]:col-start-1 max-[760px]:row-auto max-[760px]:border-r-0 max-[760px]:border-t" />
      </section>

      <Preview />
    </main>
  );
}

/**
 * All-in-one preset arranging every pane in a two-column layout.
 *
 * For custom layouts (e.g. preview below the builder), compose the parts
 * directly: `TemplateBuilder.Provider` wraps `TemplateBuilder.Toolbar`,
 * `.Palette`, `.Canvas`, `.Inspector`, and `.Preview`, which share the
 * provider's state and drag-and-drop context.
 */
function TemplateBuilderRoot({
  apiUrl,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  className,
}: TemplateBuilderProps = {}) {
  return (
    <BuilderProvider
      apiUrl={apiUrl}
      initialTemplate={initialTemplate}
      initialData={initialData}
      onChange={onChange}
      onRendered={onRendered}
    >
      <DefaultLayout className={className} />
    </BuilderProvider>
  );
}

export const TemplateBuilder = Object.assign(TemplateBuilderRoot, {
  Provider: BuilderProvider,
  Toolbar,
  Palette,
  Canvas,
  Inspector,
  Preview,
});
