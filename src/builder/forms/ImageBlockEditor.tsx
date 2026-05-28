import type { ChangeEvent, ReactNode } from "react";
import type { Align, Block, ImageBlock } from "../../types/generated/template";
import type { BlockEditorProps } from "./blockEditors";

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
    <div className="inline-block-form">
      <div className="image-block-editor__preview" data-name="preview">
        {src ? (
          <img src={src} alt={alt} className="image-block-editor__preview-image" />
        ) : (
          <div className="image-block-editor__preview-empty">No image selected</div>
        )}
      </div>

      <label>
        Source
        <input
          name="src"
          type="text"
          value={src}
          onChange={(event) => handleSrcChange(event.currentTarget.value)}
        />
      </label>

      <label>
        Upload
        <input name="src-file" type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      <label>
        Alt text
        <input
          name="alt"
          type="text"
          value={alt}
          onChange={(event) => handleAltChange(event.currentTarget.value)}
        />
      </label>
      <p className="image-block-editor__hint">
        Alt text is required for PDF/UA accessibility. Describe what the image conveys.
      </p>

      {showLayoutControls ? (
        <>
          <label>
            Max height (mm)
            <input
              name="config.maxHeight"
              type="number"
              min={0}
              value={maxHeight ?? ""}
              onChange={(event) =>
                handleMaxHeightChange(event.currentTarget.value, event.currentTarget.valueAsNumber)
              }
            />
          </label>

          <label>
            Width
            <input
              name="config.width"
              type="text"
              value={width}
              onChange={(event) => handleWidthChange(event.currentTarget.value)}
            />
          </label>

          <label>
            Align
            <select
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
