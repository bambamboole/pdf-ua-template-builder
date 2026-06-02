import { json } from "@codemirror/lang-json";
import ReactCodeMirror from "@uiw/react-codemirror";
import { jsonSchema } from "codemirror-json-schema";
import { useMemo } from "react";
import { useTemplateEditor } from "./TemplateEditorContext";
import { editorTheme } from "./editorTheme";

export interface CodeEditorProps {
  className?: string;
}

export function CodeEditor({ className }: CodeEditorProps = {}) {
  const { text, setText, schema } = useTemplateEditor();

  // The Template schema is extracted from backend OpenAPI at runtime; until it arrives
  // the editor runs without schema validation/completion. ReactCodeMirror reconfigures
  // when this array's identity changes, so the schema extension activates as soon as it loads.
  const extensions = useMemo(
    () =>
      schema
        ? [json(), jsonSchema(schema as Parameters<typeof jsonSchema>[0]), ...editorTheme]
        : [json(), ...editorTheme],
    [schema],
  );

  return (
    <div
      className={`pdfua-template-builder min-w-0 min-h-0 overflow-auto bg-surface${className ? ` ${className}` : ""}`}
      aria-label="Template JSON editor"
    >
      <ReactCodeMirror
        value={text}
        onChange={setText}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{ foldGutter: true, highlightActiveLine: true, autocompletion: true }}
      />
    </div>
  );
}
