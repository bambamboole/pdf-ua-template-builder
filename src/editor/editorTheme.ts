import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

const baseTheme = EditorView.theme({
  "&": {
    color: "var(--pdfua-fg)",
    backgroundColor: "var(--pdfua-surface)",
    fontSize: "13px",
    height: "100%",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    caretColor: "var(--pdfua-fg)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--pdfua-surface)",
    color: "var(--pdfua-fg-subtle)",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--pdfua-accent) 8%, transparent)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--pdfua-fg)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in oklab, var(--pdfua-accent) 22%, transparent)",
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: t.propertyName, color: "var(--pdfua-accent)" },
  { tag: t.string, color: "var(--pdfua-fg)" },
  { tag: [t.number, t.bool, t.null], color: "var(--pdfua-accent)" },
  { tag: [t.punctuation, t.separator], color: "var(--pdfua-fg-muted)" },
]);

// Editor styling driven by the --pdfua-* tokens, so it follows light/dark automatically.
export const editorTheme = [baseTheme, syntaxHighlighting(highlightStyle)];
