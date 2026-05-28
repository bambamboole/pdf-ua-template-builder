import type { ChangeEvent, ReactNode } from "react";
import type { Align, Block, ImageBlock } from "../../types/generated/template";
import type { BlockEditorProps } from "./blockEditors";

const fieldLabelClass =
  "grid min-w-0 gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-500";

const controlClass =
  "w-full min-w-0 min-h-8 rounded-md border border-solid border-stone-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-stone-900 outline-none transition-colors hover:border-stone-300 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

export function ImageBlockEditor({
  block,
  onChangeBlock,
  showLayoutControls = true,
}: BlockEditorProps): ReactNode {
  const imageBlock = block as ImageBlock;
  const src = imageBlock.src ?? "";
  const alt = imageBlock.alt ?? "";
  const maxHeight = imageBlock.config?.maxHeight;
  const width = (imageBlock.config?.width ?? "") as string;
  const align = (imageBlock.config?.align ?? "") as Align | "";

  function handleSrcChange(value: string): void {
    onChangeBlock({ ...imageBlock, src: value });
  }

  function handleAltChange(value: string): void {
    onChangeBlock({ ...imageBlock, alt: value });
  }

  function handleMaxHeightChange(value: string, valueAsNumber: number | undefined): void {
    const next = value === "" || !Number.isFinite(valueAsNumber) ? undefined : valueAsNumber;

    onChangeBlock(setConfigField(imageBlock, "maxHeight", next));
  }

  function handleWidthChange(value: string): void {
    onChangeBlock(setConfigField(imageBlock, "width", value || undefined));
  }

  function handleAlignChange(value: string): void {
    onChangeBlock(setConfigField(imageBlock, "align", value === "" ? undefined : value));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        onChangeBlock({ ...imageBlock, src: reader.result });
      }
    });
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-3 [container-type:inline-size]">
      <div
        className="grid min-h-24 place-items-center rounded-md border border-solid border-stone-200 bg-stone-100 p-3"
        data-name="preview"
      >
        {src ? (
          <img src={src} alt={alt} className="max-h-[120px] max-w-full object-contain" />
        ) : (
          <div className="text-[11px] text-stone-500">No image selected</div>
        )}
      </div>

      <label className={fieldLabelClass}>
        Source
        <input
          className={controlClass}
          name="src"
          type="text"
          value={src}
          onChange={(event) => handleSrcChange(event.currentTarget.value)}
        />
      </label>

      <label className={fieldLabelClass}>
        Upload
        <input
          className={controlClass}
          name="src-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>

      <label className={fieldLabelClass}>
        Alt text
        <input
          className={controlClass}
          name="alt"
          type="text"
          value={alt}
          onChange={(event) => handleAltChange(event.currentTarget.value)}
        />
      </label>
      <p className="-mt-2 m-0 text-[11px] text-stone-500">
        Alt text is required for PDF/UA accessibility. Describe what the image conveys.
      </p>

      {showLayoutControls ? (
        <>
          <label className={fieldLabelClass}>
            Max height (mm)
            <input
              className={controlClass}
              name="config.maxHeight"
              type="number"
              min={0}
              value={maxHeight ?? ""}
              onChange={(event) =>
                handleMaxHeightChange(event.currentTarget.value, event.currentTarget.valueAsNumber)
              }
            />
          </label>

          <label className={fieldLabelClass}>
            Width
            <input
              className={controlClass}
              name="config.width"
              type="text"
              value={width}
              onChange={(event) => handleWidthChange(event.currentTarget.value)}
            />
          </label>

          <label className={fieldLabelClass}>
            Align
            <select
              className={controlClass}
              name="config.align"
              value={align}
              onChange={(event) => handleAlignChange(event.currentTarget.value)}
            >
              <option value="" />
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>
        </>
      ) : null}
    </div>
  );
}

function setConfigField(block: ImageBlock, key: string, value: unknown): Block {
  const config = { ...block.config } as Record<string, unknown>;

  if (value === undefined) {
    delete config[key];
  } else {
    config[key] = value;
  }

  const nextBlock: ImageBlock = {
    ...block,
    config: Object.keys(config).length === 0 ? undefined : (config as ImageBlock["config"]),
  };

  if (nextBlock.config === undefined) {
    delete (nextBlock as { config?: ImageBlock["config"] }).config;
  }

  return nextBlock as Block;
}
