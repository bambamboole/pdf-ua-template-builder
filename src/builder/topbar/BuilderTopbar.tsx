import { useEffect, useRef, useState } from "react";
import type { Orientation, PageFormat } from "../../types/generated/template";
import { selectControlClass } from "../forms/controls/fieldStyles";
import { PAGE_SIZES_MM } from "../lib/pageSizes";

const PAGE_FORMATS = Object.keys(PAGE_SIZES_MM) as PageFormat[];

const buttonClass =
  "inline-flex h-8 items-center gap-2 m-0 whitespace-nowrap rounded-md border border-solid border-stone-200 bg-white px-3 font-medium text-stone-900 transition-colors hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-white disabled:text-stone-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

const primaryButtonClass =
  "inline-flex h-8 items-center gap-2 m-0 whitespace-nowrap rounded-md border border-solid border-stone-800 bg-stone-800 px-3 font-semibold text-white transition-colors hover:border-stone-950 hover:bg-stone-950 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-600/20";

const iconGhostButtonClass =
  "inline-flex h-8 w-8 items-center justify-center m-0 cursor-pointer rounded-md border border-solid border-transparent bg-transparent p-0 text-stone-900 transition-colors hover:border-stone-200 hover:bg-stone-100 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

const selectClass = selectControlClass;

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-solid border-stone-200 bg-white px-3 text-stone-900 outline-none transition-colors hover:border-stone-300 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

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
      className="col-span-full flex min-w-0 h-14 items-center gap-3 border-0 border-b border-solid border-stone-200 bg-white px-4"
      aria-label="Template builder toolbar"
    >
      <div className="flex items-center gap-2 whitespace-nowrap text-[17px] font-semibold tracking-tight text-stone-900">
        <span
          className="inline-grid h-[22px] w-[22px] place-items-center rounded bg-stone-800 text-[11px] font-semibold text-white"
          aria-hidden="true"
        >
          ◳
        </span>
        <span>Template Builder</span>
        <span className="text-[15px] font-medium text-stone-500">· pdf-ua</span>
      </div>

      <div className="flex-auto" />

      <div className="flex items-center gap-2">
        <select
          className={`${selectClass} min-w-[88px]`}
          value={format}
          onChange={(event) => onChangeFormat(event.currentTarget.value as PageFormat)}
          aria-label="Page format"
        >
          {PAGE_FORMATS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          className={`${selectClass} min-w-[112px]`}
          value={orientation}
          onChange={(event) => onChangeOrientation(event.currentTarget.value as Orientation)}
          aria-label="Orientation"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={onLoadExample}
          disabled={exampleDisabled}
        >
          Load example
        </button>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={onRender}
          disabled={renderDisabled}
        >
          {rendering ? "Rendering…" : "Render PDF"}
        </button>
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
      <button
        type="button"
        className={iconGhostButtonClass}
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⚙
      </button>
      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-10 grid w-80 gap-2 rounded-lg border border-solid border-stone-200 bg-white p-3 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.12)]"
          role="dialog"
          aria-label="Settings"
        >
          <label className="grid gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
            API URL
            <input
              className={inputClass}
              value={apiUrl}
              onChange={(event) => onApiUrlChange(event.currentTarget.value)}
            />
          </label>
          <button
            type="button"
            className={buttonClass}
            onClick={onLoadSchema}
            disabled={schemaLoading}
          >
            {schemaLoading ? "Loading…" : "Reload schema"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
