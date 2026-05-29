import type { ChangeEvent, ReactNode } from "react";
import type { ImageBlock } from "../../types/generated/template";
import type { BlockEditorProps } from "./blockEditors";
import { Field, Input } from "./controls";

export function ImageBlockEditor({ block, onChangeBlock }: BlockEditorProps): ReactNode {
  const imageBlock = block as ImageBlock;
  const src = imageBlock.src ?? "";
  const alt = imageBlock.alt ?? "";

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
        className="grid min-h-24 place-items-center rounded-md border border-solid border-border bg-surface-muted p-3"
        data-name="preview"
      >
        {src ? (
          <img src={src} alt={alt} className="max-h-[120px] max-w-full object-contain" />
        ) : (
          <div className="text-2xs text-fg-muted">No image selected</div>
        )}
      </div>

      <Field label="Source">
        <Input
          name="src"
          type="text"
          value={src}
          onChange={(event) => onChangeBlock({ ...imageBlock, src: event.currentTarget.value })}
        />
      </Field>

      <Field label="Upload">
        <Input name="src-file" type="file" accept="image/*" onChange={handleFileChange} />
      </Field>

      <Field label="Alt text">
        <Input
          name="alt"
          type="text"
          value={alt}
          onChange={(event) => onChangeBlock({ ...imageBlock, alt: event.currentTarget.value })}
        />
      </Field>
      <p className="-mt-2 m-0 text-2xs text-fg-muted">
        Alt text is required for PDF/UA accessibility. Describe what the image conveys.
      </p>
    </div>
  );
}
