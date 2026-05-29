import type { ChangeEvent, ReactNode } from "react";
import type { ImageBlock } from "../../types/generated/template";
import { setBlockConfigValue, type BlockEditorProps } from "./blockEditors";
import { AlignSelect } from "./controls";
import { controlClass, fieldLabelClass } from "./controls/fieldStyles";

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
  const align = (imageBlock.config?.align ?? "") as string;

  function handleSrcChange(value: string): void {
    onChangeBlock({ ...imageBlock, src: value });
  }

  function handleAltChange(value: string): void {
    onChangeBlock({ ...imageBlock, alt: value });
  }

  function handleMaxHeightChange(value: string, valueAsNumber: number | undefined): void {
    const next = value === "" || !Number.isFinite(valueAsNumber) ? undefined : valueAsNumber;

    onChangeBlock(setBlockConfigValue(imageBlock, "maxHeight", next));
  }

  function handleWidthChange(value: string): void {
    onChangeBlock(setBlockConfigValue(imageBlock, "width", value || undefined));
  }

  function handleAlignChange(value: string): void {
    onChangeBlock(setBlockConfigValue(imageBlock, "align", value === "" ? undefined : value));
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
          <div className="text-2xs text-stone-500">No image selected</div>
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
      <p className="-mt-2 m-0 text-2xs text-stone-500">
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

          <AlignSelect name="config.align" value={align} onChange={handleAlignChange} />
        </>
      ) : null}
    </div>
  );
}
