import { Palette } from "./blocks/Palette";
import { Canvas } from "./canvas/Canvas";
import type { TemplateExample } from "./context/BuilderContext";
import { Inspector } from "./inspector/Inspector";
import { PageSettings } from "./inspector/PageSettings";

export interface BuilderProps {
  className?: string;
  /** Loadable examples surfaced in the palette, keyed by display name. */
  examples?: Record<string, TemplateExample>;
}

export function Builder({ className, examples }: BuilderProps = {}) {
  return (
    <section
      className={`pdfua-template-builder grid min-w-0 min-h-0 bg-app grid-rows-[auto_auto_minmax(0,1fr)]${className ? ` ${className}` : ""}`}
      aria-label="Template authoring"
    >
      <PageSettings />
      <Palette examples={examples} />

      <div className="relative min-h-0 min-w-0">
        <Canvas className="h-full" />
        <Inspector />
      </div>
    </section>
  );
}
