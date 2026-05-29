import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Block, KeyValueBlock } from "../../types/generated/template";
import { isRecord, omitKey, renameKey } from "../lib/records";
import { useBuilderSensors } from "../lib/sensors";
import { AddButton } from "../primitives/Button";
import type { BlockEditorProps } from "./blockEditors";
import { SortableRow } from "./SortableRow";
import { Field, FieldGroup, Input } from "./controls";

interface KeyValueField {
  key: string;
  label: string;
}

interface KeyValueValues {
  [key: string]: string | null;
}

export function moveField(
  fields: readonly KeyValueField[],
  sourceIndex: number,
  targetIndex: number,
): KeyValueField[] {
  return arrayMove([...fields], sourceIndex, targetIndex);
}

export function addField(block: KeyValueBlock): KeyValueBlock {
  const fields = getFields(block);
  const values = getValues(block);
  const nextIndex = nextFieldIndex(fields);
  const nextFields = [...fields, { key: `field${nextIndex}`, label: `Field ${nextIndex}` }];

  return applyFields(block, nextFields, values);
}

export function removeField(block: KeyValueBlock, index: number): KeyValueBlock {
  const fields = getFields(block);
  const removed = fields[index];

  if (!removed) {
    return block;
  }

  return applyFields(
    block,
    fields.filter((_, currentIndex) => currentIndex !== index),
    omitKey(getValues(block), removed.key),
  );
}

export function renameFieldKey(
  block: KeyValueBlock,
  index: number,
  nextKey: string,
): KeyValueBlock {
  const fields = getFields(block);
  const previous = fields[index];

  if (!previous || previous.key === nextKey) {
    return block;
  }

  return applyFields(
    block,
    fields.map((field, currentIndex) =>
      currentIndex === index ? { ...field, key: nextKey } : field,
    ),
    renameKey(getValues(block), previous.key, nextKey),
  );
}

export function setFieldLabel(
  block: KeyValueBlock,
  index: number,
  nextLabel: string,
): KeyValueBlock {
  const fields = getFields(block);

  return applyFields(
    block,
    fields.map((field, currentIndex) =>
      currentIndex === index ? { ...field, label: nextLabel } : field,
    ),
    getValues(block),
  );
}

export function setValue(block: KeyValueBlock, key: string, nextValue: string): KeyValueBlock {
  return applyFields(block, getFields(block), { ...getValues(block), [key]: nextValue });
}

export function reorderFields(
  block: KeyValueBlock,
  sourceIndex: number,
  targetIndex: number,
): KeyValueBlock {
  return applyFields(block, moveField(getFields(block), sourceIndex, targetIndex), getValues(block));
}

export function KeyValueBlockEditor({ block, onChangeBlock }: BlockEditorProps): ReactNode {
  const kvBlock = block as KeyValueBlock;
  const fields = getFields(kvBlock);
  const values = getValues(kvBlock);

  return (
    <div className="grid gap-3 [container-type:inline-size]">
      <FieldsEditor block={kvBlock} fields={fields} onChangeBlock={onChangeBlock} />

      {fields.length > 0 ? (
        <FieldGroup legend="Values">
          {fields.map((field) => (
            <Field key={field.key} label={field.label || field.key}>
              <Input
                name={`values.${field.key}`}
                type="text"
                value={String(values[field.key] ?? "")}
                onChange={(event) =>
                  onChangeBlock(setValue(kvBlock, field.key, event.currentTarget.value))
                }
              />
            </Field>
          ))}
        </FieldGroup>
      ) : null}
    </div>
  );
}

interface FieldsEditorProps {
  block: KeyValueBlock;
  fields: KeyValueField[];
  onChangeBlock: (block: Block) => void;
}

function FieldsEditor({ block, fields, onChangeBlock }: FieldsEditorProps) {
  const sensors = useBuilderSensors();

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const sourceIndex = Number(active.id);
    const targetIndex = Number(over.id);

    if (!Number.isFinite(sourceIndex) || !Number.isFinite(targetIndex)) {
      return;
    }

    onChangeBlock(reorderFields(block, sourceIndex, targetIndex));
  }

  const sortableIds = fields.map((_, index) => String(index));

  return (
    <FieldGroup legend="Fields">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <FieldRow
              key={fieldRowKey(field, index)}
              id={String(index)}
              index={index}
              field={field}
              onChangeKey={(value) => onChangeBlock(renameFieldKey(block, index, value))}
              onChangeLabel={(value) => onChangeBlock(setFieldLabel(block, index, value))}
              onRemove={() => onChangeBlock(removeField(block, index))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <AddButton data-name="add-field" onClick={() => onChangeBlock(addField(block))}>
        Add field
      </AddButton>
    </FieldGroup>
  );
}

interface FieldRowProps {
  id: string;
  index: number;
  field: KeyValueField;
  onChangeKey: (value: string) => void;
  onChangeLabel: (value: string) => void;
  onRemove: () => void;
}

function FieldRow({ id, index, field, onChangeKey, onChangeLabel, onRemove }: FieldRowProps) {
  return (
    <SortableRow
      id={id}
      dragLabel={`Drag to reorder field ${index + 1}`}
      removeLabel={`Remove field ${index + 1}`}
      removeName={`remove-field-${index}`}
      onRemove={onRemove}
    >
      <Field label="Key">
        <Input
          name={`field-key-${index}`}
          type="text"
          value={field.key}
          onChange={(event) => onChangeKey(event.currentTarget.value)}
        />
      </Field>
      <Field label="Label">
        <Input
          name={`field-label-${index}`}
          type="text"
          value={field.label}
          onChange={(event) => onChangeLabel(event.currentTarget.value)}
        />
      </Field>
    </SortableRow>
  );
}

function fieldRowKey(field: KeyValueField, index: number): string {
  return field.key.length > 0 ? `key:${field.key}` : `index:${index}`;
}

function getFields(block: KeyValueBlock): KeyValueField[] {
  const candidate = block.config?.fields;

  return Array.isArray(candidate) ? (candidate as KeyValueField[]) : [];
}

function getValues(block: KeyValueBlock): KeyValueValues {
  const candidate = block.values;

  return isRecord(candidate) ? (candidate as KeyValueValues) : {};
}

function nextFieldIndex(fields: KeyValueField[]): number {
  let index = fields.length + 1;

  while (fields.some((field) => field.key === `field${index}`)) {
    index += 1;
  }

  return index;
}

function applyFields(
  block: KeyValueBlock,
  fields: KeyValueField[],
  values: KeyValueValues,
): KeyValueBlock {
  const config = { ...block.config };

  if (fields.length === 0) {
    delete (config as { fields?: KeyValueField[] }).fields;
  } else {
    (config as { fields?: KeyValueField[] }).fields = fields;
  }

  const nextBlock: KeyValueBlock = {
    ...block,
    config: Object.keys(config).length === 0 ? undefined : config,
  };

  if (Object.keys(values).length === 0) {
    delete (nextBlock as { values?: KeyValueValues }).values;
  } else {
    nextBlock.values = values;
  }

  if (nextBlock.config === undefined) {
    delete (nextBlock as { config?: KeyValueBlock["config"] }).config;
  }

  return nextBlock;
}
