import { useTemplateBuilderContext } from "../context/TemplateBuilderContext";
import { TemplateBuilderCanvas } from "./TemplateBuilderCanvas";
import { TemplateBuilderInspector } from "./TemplateBuilderInspector";
import { TemplateBuilderPalette } from "./TemplateBuilderPalette";
import { TemplateBuilderPreview } from "./TemplateBuilderPreview";
import { TemplateBuilderToolbar } from "./TemplateBuilderToolbar";

export interface DefaultBuilderLayoutProps {
  className?: string;
}

const shellClass =
  "grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible";

const canvasPlacement =
  "col-start-2 row-start-3 max-[760px]:col-start-1 max-[760px]:col-span-1 max-[760px]:row-auto";
const emptyCanvasPlacement = "col-span-full row-start-3 max-[760px]:row-auto";
const inspectorPlacement =
  "col-start-1 row-start-3 border-0 border-r border-solid border-border max-[760px]:col-start-1 max-[760px]:row-auto max-[760px]:border-r-0 max-[760px]:border-t";

export function DefaultBuilderLayout({ className }: DefaultBuilderLayoutProps = {}) {
  const { schema } = useTemplateBuilderContext();

  return (
    <main className={className ? `${shellClass} ${className}` : shellClass}>
      <section
        className="grid min-w-0 min-h-0 border-0 border-r border-solid border-border bg-app grid-cols-[minmax(320px,360px)_minmax(360px,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] max-[760px]:grid-cols-1"
        aria-label="Template authoring"
      >
        <TemplateBuilderToolbar className="col-span-full" />

        <TemplateBuilderPalette className="col-span-full row-start-2 max-[760px]:col-span-1 max-[760px]:row-auto" />

        <TemplateBuilderCanvas className={schema ? canvasPlacement : emptyCanvasPlacement} />

        <TemplateBuilderInspector className={inspectorPlacement} />
      </section>

      <TemplateBuilderPreview />
    </main>
  );
}
