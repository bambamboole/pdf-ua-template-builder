import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveDefaultApiUrl } from "../../api/pdfUaApi";
import type {
  Block,
  Orientation,
  PageFormat,
  Template,
} from "../../types/generated/template";
import type { TemplateData, TemplateSchemaResponse } from "../../types/template";
import { getBlockSummary } from "../blocks/blockChrome";
import { BlockCardPreview } from "../canvas/BlockCardPreview";
import { useBuilderDragDrop, type ActiveDrag } from "../hooks/useBuilderDragDrop";
import { usePdfUaApi } from "../hooks/usePdfUaApi";
import { Chip } from "../primitives/Chip";
import {
  getFooterRepeat,
  getPageNumbers,
  getPageSize,
  resolveSelectedEditorBlock,
  serializeTemplate,
  type EditorBlock,
  type EditorModel,
  type PageNumbersValue,
  type ResolvedPageSize,
} from "../state/editorModel";
import { createEditorState, editorReducer } from "../state/editorReducer";
import { getBlockTypes, type JsonSchemaObject } from "../schema/schemaAdapter";
import { createInvoiceExample } from "../schema/invoiceExample";

const emptyTemplate: Template = {
  version: 1,
};

export interface BuilderProviderProps {
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
  /** Pane slots to arrange. They share this provider's state and DnD context. */
  children: ReactNode;
}

export interface BuilderContextValue {
  schema: TemplateSchemaResponse | null;
  schemaLoading: boolean;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  model: EditorModel;
  data: TemplateData;
  serializedTemplate: Template;
  selectedBlockUid: string | null;
  selectedBlock: EditorBlock | null;
  blockTypes: ReturnType<typeof getBlockTypes>;
  pageSize: ResolvedPageSize;
  footerRepeat: boolean;
  pageNumbers: PageNumbersValue;
  pdfUrl: string | null;
  pdfLoading: boolean;
  error: string | null;
  loadSchema: () => void;
  renderPdf: () => void;
  loadExample: () => void;
  addBlock: (type: string) => void;
  changeBlock: (blockUid: string, block: Block) => void;
  changeTemplateSettings: (template: Template) => void;
  removeBlock: (blockUid: string) => void;
  selectBlock: (blockUid: string) => void;
  deselect: () => void;
  setRowWidths: (rowUid: string, widths: string[]) => void;
  changeData: (data: TemplateData) => void;
  changeFormat: (format: PageFormat) => void;
  changeOrientation: (orientation: Orientation) => void;
  toggleFooterRepeat: (repeat: boolean) => void;
  changePageNumbers: (value: PageNumbersValue) => void;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useTemplateBuilder(): BuilderContextValue {
  const value = useContext(BuilderContext);

  if (!value) {
    throw new Error("useTemplateBuilder must be used within a <TemplateBuilder.Provider>.");
  }

  return value;
}

export function BuilderProvider({
  apiUrl: initialApiUrlProp,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  children,
}: BuilderProviderProps) {
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

  const changeBlock = useCallback((blockUid: string, block: Block) => {
    dispatch({ type: "changeBlock", blockUid, block });
  }, []);

  const changeTemplateSettings = useCallback((template: Template) => {
    dispatch({ type: "changeTemplateSettings", template });
  }, []);

  const removeBlock = useCallback((blockUid: string) => {
    dispatch({ type: "removeBlock", blockUid });
  }, []);

  const selectBlock = useCallback((blockUid: string) => {
    dispatch({ type: "selectBlock", blockUid });
  }, []);

  const deselect = useCallback(() => {
    dispatch({ type: "deselect" });
  }, []);

  const setRowWidths = useCallback((rowUid: string, widths: string[]) => {
    dispatch({ type: "setRowWidths", rowUid, widths });
  }, []);

  const changeData = useCallback((nextData: TemplateData) => {
    dispatch({ type: "setData", data: nextData });
  }, []);

  const addBlock = useCallback(
    (type: string) => {
      if (!schemaObject) {
        return;
      }
      dispatch({ type: "addBlock", schema: schemaObject, blockType: type });
    },
    [schemaObject],
  );

  const changeFormat = useCallback((format: PageFormat) => {
    dispatch({ type: "setFormat", format });
  }, []);

  const changeOrientation = useCallback((orientation: Orientation) => {
    dispatch({ type: "setOrientation", orientation });
  }, []);

  const toggleFooterRepeat = useCallback((repeat: boolean) => {
    dispatch({ type: "setFooterRepeat", repeat });
  }, []);

  const changePageNumbers = useCallback((value: PageNumbersValue) => {
    dispatch({ type: "setPageNumbers", value });
  }, []);

  const handleLoadSchema = useCallback(() => {
    void loadSchema(apiUrl);
  }, [loadSchema, apiUrl]);

  const handleRenderPdf = useCallback(() => {
    void renderPdf(serializedTemplate, data);
  }, [renderPdf, serializedTemplate, data]);

  const value = useMemo<BuilderContextValue>(
    () => ({
      schema,
      schemaLoading,
      apiUrl,
      setApiUrl,
      model,
      data,
      serializedTemplate,
      selectedBlockUid,
      selectedBlock,
      blockTypes,
      pageSize,
      footerRepeat,
      pageNumbers,
      pdfUrl,
      pdfLoading,
      error,
      loadSchema: handleLoadSchema,
      renderPdf: handleRenderPdf,
      loadExample,
      addBlock,
      changeBlock,
      changeTemplateSettings,
      removeBlock,
      selectBlock,
      deselect,
      setRowWidths,
      changeData,
      changeFormat,
      changeOrientation,
      toggleFooterRepeat,
      changePageNumbers,
    }),
    [
      schema,
      schemaLoading,
      apiUrl,
      model,
      data,
      serializedTemplate,
      selectedBlockUid,
      selectedBlock,
      blockTypes,
      pageSize,
      footerRepeat,
      pageNumbers,
      pdfUrl,
      pdfLoading,
      error,
      handleLoadSchema,
      handleRenderPdf,
      loadExample,
      addBlock,
      changeBlock,
      changeTemplateSettings,
      removeBlock,
      selectBlock,
      deselect,
      setRowWidths,
      changeData,
      changeFormat,
      changeOrientation,
      toggleFooterRepeat,
      changePageNumbers,
    ],
  );

  return (
    <BuilderContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        {children}

        <DragOverlay dropAnimation={null}>
          {activeDrag ? <ActiveDragPreview drag={activeDrag} /> : null}
        </DragOverlay>
      </DndContext>
    </BuilderContext.Provider>
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
