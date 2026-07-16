import { useEffect, useMemo, useRef, useState } from "react";
import { ListPlus, Play, Search, Tags, Video, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { SgTagRow } from "../../types";

type MatrixTagsPanelProps = {
  activeRowId?: string | null;
  className?: string;
  contextLabel: string;
  isDocked?: boolean;
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
    <span className="relative flex aspect-video w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-cell-empty)] text-[var(--sg-matrix-text-muted)]">
      {thumbnailUrl && !hasError ? (
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" onError={() => setHasError(true)} />
      ) : (
        <Video aria-hidden="true" className="h-4 w-4" />
      )}
      <span className="absolute inset-x-1 bottom-1 truncate rounded-sm bg-black/85 px-1 py-0.5 text-center text-[9px] font-medium leading-none text-white">
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

export const MatrixTagsPanel = ({
  activeRowId,
  className,
  contextLabel,
  isDocked = false,
  onClose,
  onPlayRow,
  rows,
}: MatrixTagsPanelProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeRowRef = useRef<HTMLLIElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) =>
      [row.action, row.player, row.team, row.groupValue, row.result, row.timecode]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [rows, searchQuery]);

  useEffect(() => {
    if (isDocked) return;
    closeButtonRef.current?.focus();
  }, [contextLabel, isDocked]);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeRowId, filteredRows]);

  return (
    <aside
      id="matrix-matching-tags-panel"
      aria-label={`Matching tags for ${contextLabel}`}
      className={cn(
        "flex min-h-0 flex-col border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)]",
        isDocked ? "h-full border-l" : "absolute inset-y-0 right-0 z-40 w-[min(260px,calc(100%_-_2.75rem))] border-l",
        className
      )}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="flex h-[34px] items-center justify-between gap-3 border-b border-[var(--sg-matrix-grid-border)] px-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-normal text-[var(--sg-matrix-text)]">All Tags</h3>
            <span className="text-[11px] tabular-nums text-[var(--sg-matrix-text-muted)]">{filteredRows.length}</span>
          </div>
          <p className="hidden truncate text-xs text-[var(--sg-matrix-text-muted)]" title={contextLabel}>
            {contextLabel}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close matching tags"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sg-matrix-active-border)]",
            isDocked && rows.length === 0 && "invisible"
          )}
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="hidden border-b border-[var(--sg-matrix-grid-border)] p-1.5">
        <label className="flex h-8 items-center gap-2 rounded border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-2 text-xs text-[var(--sg-matrix-text-secondary)]">
          <Search className="h-3.5 w-3.5" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tags"
            className="min-w-0 flex-1 bg-transparent text-xs text-[var(--sg-matrix-text)] outline-none placeholder:text-[var(--sg-matrix-text-muted)]"
          />
        </label>
      </div>

      {filteredRows.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sg-matrix-selected-nav)] text-[var(--sg-matrix-text-muted)]">
            <Tags aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="mt-3 text-sm font-medium text-[var(--sg-matrix-text-secondary)]">No tags selected</div>
          <div className="mt-1 text-xs leading-5 text-[var(--sg-matrix-text-muted)]">
            {rows.length === 0
              ? "Select a populated matrix cell to filter matching tags."
              : "No tags match the search."}
          </div>
        </div>
      ) : (
        <ul className="vertical-scrollbar scrollbar-md min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5">
          {filteredRows.map((row) => {
            const isActive = activeRowId === row.id;
            const rowMeta = getRowMeta(row);

            return (
              <li key={row.id} ref={isActive ? activeRowRef : undefined}>
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group flex h-[78px] w-full items-start gap-2 rounded-[6px] border border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-selected-nav)] px-1.5 py-1.5 text-left transition-colors duration-150",
                    "hover:border-[var(--sg-matrix-selected-card-border)] hover:bg-[var(--sg-matrix-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sg-matrix-active-border)]",
                    isActive && "border-[var(--sg-matrix-selected-card-border)] bg-[var(--sg-matrix-hover)]"
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
                    <span
                      className="block truncate text-[10px] font-normal text-[var(--sg-matrix-text-muted)]"
                      title={row.timecode}
                    >
                      {row.timecode}
                    </span>
                    <span
                      className="mt-1.5 block line-clamp-2 text-[11px] leading-4 text-[var(--sg-matrix-tag-title)]"
                      title={row.action}
                    >
                      {row.action}
                    </span>
                    <span
                      className="mt-1 block truncate text-[10px] text-[var(--sg-matrix-text-muted)]"
                      title={rowMeta || "Tag clip"}
                    >
                      {rowMeta || "Tag clip"}
                    </span>
                  </span>
                  <span
                    aria-label="Included in playlist selection"
                    className="hidden"
                    title="Included in playlist selection"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};
