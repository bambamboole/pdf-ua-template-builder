import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { resolveDefaultApiUrl } from "../api/pdfUaApi";
import type { Block, Orientation, PageFormat, Template } from "../types/generated/template";
import type { TemplateData } from "../types/template";
import { BlockPalette } from "./blocks/BlockPalette";
import { getBlockSummary } from "./blocks/blockChrome";
import { Chip } from "./primitives/Chip";
import { BlockCardPreview } from "./canvas/BlockCardPreview";
import { BuilderCanvas } from "./canvas/BuilderCanvas";
import { useBuilderDragDrop, type ActiveDrag } from "./hooks/useBuilderDragDrop";
import { usePdfUaApi } from "./hooks/usePdfUaApi";
import { BlockInspector } from "./inspector/BlockInspector";
import { DocumentSettingsInspector } from "./inspector/DocumentSettingsInspector";
import { PdfPane } from "./pdf/PdfPane";
import { createInvoiceExample } from "./schema/invoiceExample";
import { getBlockTypes, type JsonSchemaObject } from "./schema/schemaAdapter";
import {
  getFooterRepeat,
  getPageNumbers,
  getPageSize,
  resolveSelectedEditorBlock,
  serializeTemplate,
  type PageNumbersValue,
} from "./state/editorModel";
import { createEditorState, editorReducer } from "./state/editorReducer";
import { BuilderTopbar } from "./topbar/BuilderTopbar";

const emptyTemplate: Template = {
  version: 1,
};

export interface TemplateBuilderProps {
  /** Base URL of a running pdf-ua-api instance. Defaults to "" (relative URLs / proxy). */
  apiUrl?: string;
  /** Template loaded into the editor on first render. */
  initialTemplate?: Template;
  /** Runtime data keyed by block id (table rows, dynamic key-value overrides). */
  initialData?: TemplateData;
  /** Fires whenever the user edits the template or its runtime data. */
  onChange?: (template: Template, data: TemplateData) => void;
  /** Fires after a successful render with the produced PDF blob. */
  onRendered?: (pdf: Blob) => void;
  /** Optional className appended to the root element. */
  className?: string;
}

export function TemplateBuilder({
  apiUrl: initialApiUrlProp,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  className,
}: TemplateBuilderProps = {}) {
  const defaultApiUrl = resolveDefaultApiUrl(initialApiUrlProp);
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [state, dispatch] = useReducer(editorReducer, undefined, () =>
    createEditorState(initialTemplate ?? emptyTemplate, initialData ?? {}),
  );
  const { model, data, selectedBlockUid } = state;
  const modelRef = useRef(model);
  modelRef.current = model;

  const { schema, schemaLoading, pdfUrl, pdfLoading, error, loadSchema, renderPdf } = usePdfUaApi({
    initialApiUrl: defaultApiUrl,
    apiUrl,
    onRendered,
  });

  const onChangeRef = useRef(onChange);
  const skipNextChangeRef = useRef(true);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const serializedTemplate = useMemo(() => serializeTemplate(model), [model]);

  useEffect(() => {
    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      return;
    }
    onChangeRef.current?.(serializeTemplate(model), data);
  }, [model, data]);

  const schemaObject: JsonSchemaObject | null = schema;
  const blockTypes = useMemo(
    () => (schemaObject ? getBlockTypes(schemaObject) : []),
    [schemaObject],
  );
  const pageSize = getPageSize(model);
  const footerRepeat = getFooterRepeat(model);
  const pageNumbers = getPageNumbers(model);
  const selectedBlock = useMemo(
    () => resolveSelectedEditorBlock(model, selectedBlockUid),
    [model, selectedBlockUid],
  );

  const { activeDrag, sensors, onDragStart, onDragEnd, onDragCancel } = useBuilderDragDrop(
    schemaObject,
    dispatch,
    modelRef,
  );

  const loadExample = useCallback(() => {
    const example = createInvoiceExample();

    dispatch({ type: "loadExample", template: example.template, data: example.data });
  }, []);

  const handleChangeBlock = useCallback((blockUid: string, block: Block) => {
    dispatch({ type: "changeBlock", blockUid, block });
  }, []);

  const handleChangeTemplateSettings = useCallback((template: Template) => {
    dispatch({ type: "changeTemplateSettings", template });
  }, []);

  const handleRemoveBlock = useCallback((blockUid: string) => {
    dispatch({ type: "removeBlock", blockUid });
  }, []);

  const handleSelectBlock = useCallback((blockUid: string) => {
    dispatch({ type: "selectBlock", blockUid });
  }, []);

  const handleCloseInspector = useCallback(() => {
    dispatch({ type: "deselect" });
  }, []);

  const handleSetRowWidths = useCallback((rowUid: string, widths: string[]) => {
    dispatch({ type: "setRowWidths", rowUid, widths });
  }, []);

  const handleChangeData = useCallback((nextData: TemplateData) => {
    dispatch({ type: "setData", data: nextData });
  }, []);

  const handleAddBlock = useCallback(
    (type: string) => {
      if (!schemaObject) {
        return;
      }
      dispatch({ type: "addBlock", schema: schemaObject, blockType: type });
    },
    [schemaObject],
  );

  const handleChangeFormat = useCallback((format: PageFormat) => {
    dispatch({ type: "setFormat", format });
  }, []);

  const handleChangeOrientation = useCallback((orientation: Orientation) => {
    dispatch({ type: "setOrientation", orientation });
  }, []);

  const handleToggleFooterRepeat = useCallback((repeat: boolean) => {
    dispatch({ type: "setFooterRepeat", repeat });
  }, []);

  const handleChangePageNumbers = useCallback((value: PageNumbersValue) => {
    dispatch({ type: "setPageNumbers", value });
  }, []);

  const shellClass =
    "grid h-screen overflow-hidden bg-app text-fg grid-cols-[minmax(40rem,1.55fr)_minmax(28rem,0.95fr)] max-[1080px]:h-auto max-[1080px]:grid-cols-1 max-[1080px]:overflow-visible";
  const rootClassName = className ? `${shellClass} ${className}` : shellClass;

  return (
    <main className={rootClassName}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <section
          className="grid min-w-0 min-h-0 border-0 border-r border-solid border-border bg-app grid-cols-[minmax(320px,360px)_minmax(360px,1fr)] grid-rows-[auto_auto_minmax(0,1fr)] max-[760px]:grid-cols-1"
          aria-label="Template authoring"
        >
          <BuilderTopbar
            format={pageSize.format}
            orientation={pageSize.orientation}
            onChangeFormat={handleChangeFormat}
            onChangeOrientation={handleChangeOrientation}
            apiUrl={apiUrl}
            onApiUrlChange={setApiUrl}
            onLoadSchema={() => void loadSchema(apiUrl)}
            schemaLoading={schemaLoading}
            onLoadExample={loadExample}
            exampleDisabled={!schema}
            onRender={() => void renderPdf(serializedTemplate, data)}
            renderDisabled={!schema || pdfLoading}
            rendering={pdfLoading}
          />

          <aside
            className="col-span-full row-start-2 flex min-w-0 items-center overflow-hidden border-0 border-b border-solid border-border bg-surface px-4 py-2 max-[760px]:col-span-1 max-[760px]:row-auto"
            aria-label="Block palette"
          >
            <div className="flex w-full min-w-0 items-center gap-3">
              <h2 className="m-0 flex-none text-2xs font-medium uppercase tracking-[0.06em] text-fg-subtle">
                Blocks
              </h2>
              <BlockPalette blockTypes={blockTypes} onAdd={handleAddBlock} />
            </div>
          </aside>

          {schema ? (
            <BuilderCanvas
              model={model}
              data={data}
              format={pageSize.format}
              orientation={pageSize.orientation}
              footerRepeat={footerRepeat}
              pageNumbers={pageNumbers}
              selectedBlockUid={selectedBlockUid}
              onRemoveBlock={handleRemoveBlock}
              onSelectBlock={handleSelectBlock}
              onChangeBlock={handleChangeBlock}
              onDeselect={handleCloseInspector}
              onSetRowWidths={handleSetRowWidths}
              onToggleFooterRepeat={handleToggleFooterRepeat}
              onChangePageNumbers={handleChangePageNumbers}
            />
          ) : (
            <div className="col-span-full row-start-3 min-w-0 min-h-0 overflow-auto bg-canvas px-4 pb-8 pt-6 max-[760px]:row-auto">
              <div className="grid h-full place-items-center text-sm text-fg-muted">
                {schemaLoading ? "Loading schema…" : "Load the schema to start building."}
              </div>
            </div>
          )}

          {schema && selectedBlock ? (
            <BlockInspector
              block={selectedBlock}
              schema={schema}
              data={data}
              onChangeBlock={handleChangeBlock}
              onChangeData={handleChangeData}
              onRemoveBlock={handleRemoveBlock}
              onClose={handleCloseInspector}
            />
          ) : schema ? (
            <DocumentSettingsInspector
              template={serializedTemplate}
              metadata={schema["x-pdfUa"]}
              format={pageSize.format}
              orientation={pageSize.orientation}
              onChangeTemplate={handleChangeTemplateSettings}
              onChangeFormat={handleChangeFormat}
              onChangeOrientation={handleChangeOrientation}
            />
          ) : null}
        </section>

        <PdfPane
          pdfUrl={pdfUrl}
          error={error}
          loading={pdfLoading}
          template={serializedTemplate}
          data={data}
        />

        <DragOverlay dropAnimation={null}>
          {activeDrag ? <ActiveDragPreview drag={activeDrag} /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function ActiveDragPreview({ drag }: { drag: NonNullable<ActiveDrag> }) {
  if (drag.kind === "palette") {
    return <BlockCardPreview type={drag.type} prefix="+ " />;
  }
  if (drag.kind === "block") {
    return <BlockCardPreview type={drag.block.type} summary={getBlockSummary(drag.block)} />;
  }
  return (
    <div className="pointer-events-none origin-top-left rotate-[1.5deg] scale-[1.02] cursor-grabbing drop-shadow-drag">
      <div className="inline-flex min-w-[180px] max-w-[360px] items-center gap-2 rounded-lg border border-solid border-border-strong bg-surface px-3 py-2 text-sm font-medium">
        <Chip>⋮⋮</Chip>
        <span className="font-medium">Row</span>
      </div>
    </div>
  );
}
