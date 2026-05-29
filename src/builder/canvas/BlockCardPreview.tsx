import { getBlockChrome } from "../blocks/blockChrome";
import { Chip } from "../primitives/Chip";

export interface BlockCardPreviewProps {
  type: string;
  summary?: string;
  prefix?: string;
}

export function BlockCardPreview({ type, summary, prefix }: BlockCardPreviewProps) {
  const chrome = getBlockChrome(type);

  return (
    <div className="pointer-events-none origin-top-left rotate-[1.5deg] scale-[1.02] cursor-grabbing drop-shadow-drag">
      <div className="inline-flex min-w-[180px] max-w-[360px] items-center gap-2 rounded-lg border border-solid border-border-strong bg-surface px-3 py-2 text-sm font-medium">
        <Chip>{chrome.chip}</Chip>
        <span className="inline-flex items-baseline gap-2">
          <span className="font-medium">
            {prefix}
            {chrome.label}
          </span>
          {summary ? <span className="font-normal text-fg-muted">{summary}</span> : null}
        </span>
      </div>
    </div>
  );
}
