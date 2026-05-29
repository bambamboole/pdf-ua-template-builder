import { useEffect, useRef, useState } from "react";
import type { Orientation, PageFormat } from "../../types/generated/template";
import { Button } from "../primitives/Button";
import { Input, Select } from "../forms/controls";
import { PAGE_SIZES_MM } from "../lib/pageSizes";

const compactSelectClass = "w-auto py-0";

const PAGE_FORMATS = Object.keys(PAGE_SIZES_MM) as PageFormat[];

export interface BuilderTopbarProps {
  format: PageFormat;
  orientation: Orientation;
  onChangeFormat: (format: PageFormat) => void;
  onChangeOrientation: (orientation: Orientation) => void;
  apiUrl: string;
  onApiUrlChange: (value: string) => void;
  onLoadSchema: () => void;
  schemaLoading: boolean;
  onLoadExample: () => void;
  exampleDisabled: boolean;
  onRender: () => void;
  renderDisabled: boolean;
  rendering: boolean;
}

export function BuilderTopbar({
  format,
  orientation,
  onChangeFormat,
  onChangeOrientation,
  apiUrl,
  onApiUrlChange,
  onLoadSchema,
  schemaLoading,
  onLoadExample,
  exampleDisabled,
  onRender,
  renderDisabled,
  rendering,
}: BuilderTopbarProps) {
  return (
    <header
      className="col-span-full flex min-w-0 h-14 items-center gap-3 border-0 border-b border-solid border-border bg-surface px-4"
      aria-label="Template builder toolbar"
    >
      <div className="flex items-center gap-2 whitespace-nowrap text-[17px] font-semibold tracking-tight text-fg">
        <span
          className="inline-grid h-[22px] w-[22px] place-items-center rounded bg-primary text-2xs font-semibold text-on-dark"
          aria-hidden="true"
        >
          ◳
        </span>
        <span>Template Builder</span>
        <span className="text-[15px] font-medium text-fg-muted">· pdf-ua</span>
      </div>

      <div className="flex-auto" />

      <div className="flex items-center gap-2">
        <Select
          className={`${compactSelectClass} min-w-[88px]`}
          value={format}
          onChange={(event) => onChangeFormat(event.currentTarget.value as PageFormat)}
          aria-label="Page format"
        >
          {PAGE_FORMATS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select
          className={`${compactSelectClass} min-w-[112px]`}
          value={orientation}
          onChange={(event) => onChangeOrientation(event.currentTarget.value as Orientation)}
          aria-label="Orientation"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onLoadExample} disabled={exampleDisabled}>
          Load example
        </Button>
        <Button variant="primary" onClick={onRender} disabled={renderDisabled}>
          {rendering ? "Rendering…" : "Render PDF"}
        </Button>
        <SettingsPopover
          apiUrl={apiUrl}
          onApiUrlChange={onApiUrlChange}
          onLoadSchema={onLoadSchema}
          schemaLoading={schemaLoading}
        />
      </div>
    </header>
  );
}

interface SettingsPopoverProps {
  apiUrl: string;
  onApiUrlChange: (value: string) => void;
  onLoadSchema: () => void;
  schemaLoading: boolean;
}

function SettingsPopover({
  apiUrl,
  onApiUrlChange,
  onLoadSchema,
  schemaLoading,
}: SettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        icon
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⚙
      </Button>
      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-10 grid w-80 gap-2 rounded-lg border border-solid border-border bg-surface p-3 shadow-pop"
          role="dialog"
          aria-label="Settings"
        >
          <label className="grid gap-1 text-2xs font-medium uppercase tracking-wide text-fg-muted">
            API URL
            <Input
              value={apiUrl}
              onChange={(event) => onApiUrlChange(event.currentTarget.value)}
            />
          </label>
          <Button onClick={onLoadSchema} disabled={schemaLoading}>
            {schemaLoading ? "Loading…" : "Reload schema"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
