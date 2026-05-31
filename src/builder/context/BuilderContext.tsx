import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import { usePdfUaApi } from "../../render/usePdfUaApi";
import { RenderProvider, type RenderContextValue } from "../../render/RenderContext";
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

const emptyTemplate: Template = {
  version: 1,
};

/** A loadable example: a template plus its optional runtime data. */
export interface TemplateExample {
  template: Template;
  data?: TemplateData;
}

export interface TemplateBuilderProviderProps {
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

/** Editor state and derived values. Changes as the user edits. */
export interface BuilderState {
  schema: TemplateSchemaResponse | null;
  schemaLoading: boolean;
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
}

/** Stable editor actions. Identity never changes for the provider's lifetime. */
export interface BuilderActions {
  renderPdf: () => void;
  loadExample: (example: TemplateExample) => void;
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

export type BuilderContextValue = BuilderState & BuilderActions;

const BuilderStateContext = createContext<BuilderState | null>(null);
const BuilderActionsContext = createContext<BuilderActions | null>(null);

/** Subscribe to editor state. Re-renders on edits. */
export function useBuilderState(): BuilderState {
  const value = useContext(BuilderStateContext);

  if (!value) {
    throw new Error("useBuilderState must be used within a <TemplateBuilderProvider>.");
  }

  return value;
}

/** Read the stable editor actions. Does not re-render on edits. */
export function useBuilderActions(): BuilderActions {
  const value = useContext(BuilderActionsContext);

  if (!value) {
    throw new Error("useBuilderActions must be used within a <TemplateBuilderProvider>.");
  }

  return value;
}

/** Headless escape hatch returning both state and actions. */
export function useTemplateBuilder(): BuilderContextValue {
  return { ...useBuilderState(), ...useBuilderActions() };
}

export function TemplateBuilderProvider({
  apiUrl: apiUrlProp,
  initialTemplate,
  initialData,
  onChange,
  onRendered,
  children,
}: TemplateBuilderProviderProps) {
  const apiUrl = resolveDefaultApiUrl(apiUrlProp);
  const [state, dispatch] = useReducer(editorReducer, undefined, () =>
    createEditorState(initialTemplate ?? emptyTemplate, initialData ?? {}),
  );
  const { model, data, selectedBlockUid } = state;
  const modelRef = useRef(model);
  modelRef.current = model;

  const {
    schema,
    schemaLoading,
    pdfUrl,
    pdfLoading,
    error,
    renderPdf: renderPdfRequest,
  } = usePdfUaApi({
    initialApiUrl: apiUrl,
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
    onChangeRef.current?.(serializedTemplate, data);
  }, [serializedTemplate, data]);

  const schemaObject: JsonSchemaObject | null = schema;
  const blockTypes = useMemo(
    () => (schemaObject ? getBlockTypes(schemaObject) : []),
    [schemaObject],
  );
  const selectedBlock = useMemo(
    () => resolveSelectedEditorBlock(model, selectedBlockUid),
    [model, selectedBlockUid],
  );

  // Latest values for actions that would otherwise need them as deps, keeping
  // every action's identity stable for the provider's lifetime.
  const serializedTemplateRef = useRef(serializedTemplate);
  serializedTemplateRef.current = serializedTemplate;
  const dataRef = useRef(data);
  dataRef.current = data;
  const schemaRef = useRef(schemaObject);
  schemaRef.current = schemaObject;

  const { activeDrag, sensors, onDragStart, onDragEnd, onDragCancel } = useBuilderDragDrop(
    schemaObject,
    dispatch,
    modelRef,
  );

  const loadExample = useCallback((example: TemplateExample) => {
    dispatch({ type: "loadExample", template: example.template, data: example.data ?? {} });
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

  const addBlock = useCallback((type: string) => {
    const currentSchema = schemaRef.current;

    if (!currentSchema) {
      return;
    }
    dispatch({ type: "addBlock", schema: currentSchema, blockType: type });
  }, []);

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

  const renderPdf = useCallback(() => {
    void renderPdfRequest(serializedTemplateRef.current, dataRef.current);
  }, [renderPdfRequest]);

  const actions = useMemo<BuilderActions>(
    () => ({
      renderPdf,
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
      renderPdf,
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

  const stateValue = useMemo<BuilderState>(
    () => ({
      schema,
      schemaLoading,
      model,
      data,
      serializedTemplate,
      selectedBlockUid,
      selectedBlock,
      blockTypes,
      pageSize: getPageSize(model),
      footerRepeat: getFooterRepeat(model),
      pageNumbers: getPageNumbers(model),
      pdfUrl,
      pdfLoading,
      error,
    }),
    [
      schema,
      schemaLoading,
      model,
      data,
      serializedTemplate,
      selectedBlockUid,
      selectedBlock,
      blockTypes,
      pdfUrl,
      pdfLoading,
      error,
    ],
  );

  const renderValue = useMemo<RenderContextValue>(
    () => ({
      template: serializedTemplate,
      data,
      pdfUrl,
      pdfLoading,
      error,
      renderPdf,
      renderDisabled: !schema || pdfLoading,
    }),
    [serializedTemplate, data, pdfUrl, pdfLoading, error, renderPdf, schema],
  );

  return (
    <BuilderActionsContext.Provider value={actions}>
      <BuilderStateContext.Provider value={stateValue}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <RenderProvider value={renderValue}>{children}</RenderProvider>

          <DragOverlay dropAnimation={null}>
            {activeDrag ? <ActiveDragPreview drag={activeDrag} /> : null}
          </DragOverlay>
        </DndContext>
      </BuilderStateContext.Provider>
    </BuilderActionsContext.Provider>
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
