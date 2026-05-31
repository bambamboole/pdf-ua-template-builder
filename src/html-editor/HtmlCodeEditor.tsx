import { html } from "@codemirror/lang-html";
import ReactCodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { editorTheme } from "../editor/editorTheme";
import { useHtmlEditor } from "./HtmlEditorContext";

export interface HtmlCodeEditorProps {
  className?: string;
}

export function HtmlCodeEditor({ className }: HtmlCodeEditorProps = {}) {
  const { html: text, setHtml } = useHtmlEditor();

  const extensions = useMemo(() => [html(), ...editorTheme], []);

  return (
    <div
      className={`pdfua-template-builder min-w-0 min-h-0 overflow-auto bg-surface${className ? ` ${className}` : ""}`}
      aria-label="Template HTML editor"
    >
      <ReactCodeMirror
        value={text}
        onChange={setHtml}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{ foldGutter: true, highlightActiveLine: true, autocompletion: true }}
      />
    </div>
  );
}
