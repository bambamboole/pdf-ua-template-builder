import { useEffect, useRef, useState } from "react";
import type { Orientation, PageFormat } from "../../types/generated/template";
import { PAGE_SIZES_MM } from "../lib/pageSizes";

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
    <header className="builder-topbar" aria-label="Template builder toolbar">
      <div className="builder-topbar__brand">
        <span className="builder-topbar__brand-mark" aria-hidden="true">
          ◳
        </span>
        <span>Template Builder</span>
        <span className="builder-topbar__brand-sub">· pdf-ua</span>
      </div>

      <div className="builder-topbar__spacer" />

      <div className="builder-topbar__group">
        <select
          className="builder-select"
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
          className="builder-select"
          value={orientation}
          onChange={(event) => onChangeOrientation(event.currentTarget.value as Orientation)}
          aria-label="Orientation"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      <div className="builder-topbar__group">
        <button
          type="button"
          className="builder-button"
          onClick={onLoadExample}
          disabled={exampleDisabled}
        >
          Load example
        </button>
        <button
          type="button"
          className="builder-button builder-button--primary"
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
    <div className="builder-topbar__settings" ref={containerRef}>
      <button
        type="button"
        className="builder-button builder-button--ghost builder-button--icon"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⚙
      </button>
      {open ? (
        <div className="builder-topbar__settings-panel" role="dialog" aria-label="Settings">
          <label>
            API URL
            <input
              className="builder-input"
              value={apiUrl}
              onChange={(event) => onApiUrlChange(event.currentTarget.value)}
            />
          </label>
          <button
            type="button"
            className="builder-button"
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
