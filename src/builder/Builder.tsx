import { Palette } from "./blocks/Palette";
import { Canvas } from "./canvas/Canvas";
import { useTemplateBuilder, type TemplateExample } from "./context/BuilderContext";
import { Inspector } from "./inspector/Inspector";

export interface BuilderProps {
  className?: string;
  /** Loadable examples surfaced in the palette, keyed by display name. */
  examples?: Record<string, TemplateExample>;
}

export function Builder({ className, examples }: BuilderProps = {}) {
  const { schema } = useTemplateBuilder();

  return (
    <section
      className={`grid min-w-0 min-h-0 bg-app grid-cols-[minmax(320px,360px)_minmax(360px,1fr)] grid-rows-[auto_minmax(0,1fr)] max-[760px]:grid-cols-1${className ? ` ${className}` : ""}`}
      aria-label="Template authoring"
    >
      <Palette className="col-span-full" examples={examples} />

      <Canvas
        className={
          schema
            ? "col-start-2 row-start-2 max-[760px]:col-start-1 max-[760px]:col-span-1 max-[760px]:row-auto"
            : "col-span-full row-start-2 max-[760px]:row-auto"
        }
      />

      <Inspector className="col-start-1 row-start-2 border-0 border-r border-solid border-border max-[760px]:col-start-1 max-[760px]:row-auto max-[760px]:border-r-0 max-[760px]:border-t" />
    </section>
  );
}
