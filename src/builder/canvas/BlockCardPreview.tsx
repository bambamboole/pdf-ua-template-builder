import { getBlockChrome } from "../blocks/blockChrome";

export interface BlockCardPreviewProps {
  type: string;
  summary?: string;
  prefix?: string;
}

export function BlockCardPreview({ type, summary, prefix }: BlockCardPreviewProps) {
  const chrome = getBlockChrome(type);

  return (
    <div className="builder-drag-overlay">
      <div className="builder-drag-overlay__card">
        <span className="builder-chip" aria-hidden="true">
          {chrome.chip}
        </span>
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontWeight: 500 }}>
            {prefix}
            {chrome.label}
          </span>
          {summary ? (
            <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>{summary}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
