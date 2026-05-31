import { json } from "@codemirror/lang-json";
import ReactCodeMirror from "@uiw/react-codemirror";
import { jsonSchema } from "codemirror-json-schema";
import { useMemo } from "react";
import { useTemplateEditor } from "./TemplateEditorContext";
import { editorTheme } from "./editorTheme";
import { templateSchema } from "./templateSchema";

export interface CodeEditorProps {
  className?: string;
}

export function CodeEditor({ className }: CodeEditorProps = {}) {
  const { text, setText } = useTemplateEditor();

  const extensions = useMemo(
    () => [json(), jsonSchema(templateSchema as Parameters<typeof jsonSchema>[0]), ...editorTheme],
    [],
  );

  return (
    <div
      className={`min-w-0 min-h-0 overflow-auto bg-surface${className ? ` ${className}` : ""}`}
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
