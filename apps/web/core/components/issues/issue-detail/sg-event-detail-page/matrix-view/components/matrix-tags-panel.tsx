import { useEffect, useRef, useState } from "react";
import { Play, Video, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { SgTagRow } from "../../types";

type MatrixTagsPanelProps = {
  activeRowId?: string | null;
  contextLabel: string;
  onClose: () => void;
  onPlayRow?: (row: SgTagRow) => void | Promise<void>;
  rows: readonly SgTagRow[];
};

const getRowMeta = (row: SgTagRow) =>
  [row.player, row.team, row.result]
    .filter((value) => value && value !== "--")
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" · ");

const MatrixTagThumbnail = ({ thumbnailUrl, timecode }: { thumbnailUrl: string | null; timecode: string }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <span className="relative flex h-[70px] w-[67px] shrink-0 items-center justify-center overflow-hidden rounded border border-custom-border-100 bg-custom-background-90 text-custom-text-400">
      {thumbnailUrl && !hasError ? (
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" onError={() => setHasError(true)} />
      ) : (
        <Video aria-hidden="true" className="h-4 w-4" />
      )}
      <span className="absolute inset-x-1 bottom-1 truncate rounded-sm bg-black/80 px-1 py-0.5 text-center text-[9px] font-medium leading-none text-white">
        {timecode}
      </span>
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <Play
          aria-hidden="true"
          className="h-4 w-4 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100"
        />
      </span>
    </span>
  );
};

export const MatrixTagsPanel = ({ activeRowId, contextLabel, onClose, onPlayRow, rows }: MatrixTagsPanelProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [contextLabel]);

  return (
    <aside
      id="matrix-matching-tags-panel"
      aria-label={`Matching tags for ${contextLabel}`}
      className="absolute inset-y-0 right-0 z-40 flex w-[min(18rem,calc(100%_-_2.75rem))] flex-col border-l border-custom-border-200 bg-custom-sidebar-background-100 shadow-xl"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-custom-border-200 px-3 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-custom-text-100">All Tags</h3>
            <span className="text-xs tabular-nums text-custom-text-400">{rows.length}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-custom-text-300" title={contextLabel}>
            {contextLabel}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close matching tags"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100"
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <ul className="vertical-scrollbar scrollbar-md min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {rows.map((row) => {
          const isActive = activeRowId === row.id;
          const rowMeta = getRowMeta(row);

          return (
            <li key={row.id}>
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group flex h-20 w-full items-start gap-3 rounded border border-custom-border-200 bg-custom-background-100 px-2.5 py-[5px] text-left transition-colors",
                  "hover:border-custom-border-300 hover:bg-custom-background-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100",
                  isActive && "border-custom-primary-100 bg-custom-primary-100/10"
                )}
                disabled={!onPlayRow}
                onClick={() => void onPlayRow?.(row)}
              >
                <MatrixTagThumbnail
                  key={row.thumbnailUrl ?? "no-thumbnail"}
                  thumbnailUrl={row.thumbnailUrl}
                  timecode={row.timecode}
                />
                <span className="flex min-w-0 flex-1 self-stretch flex-col justify-center">
                  <span className="block truncate text-[10px] font-medium text-custom-text-300" title={row.timecode}>
                    {row.timecode}
                  </span>
                  <span className="mt-1.5 block line-clamp-2 text-sm leading-4 text-custom-text-100" title={row.action}>
                    {row.action}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-custom-text-400" title={rowMeta || "Tag clip"}>
                    {rowMeta || "Tag clip"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
