import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Video } from "lucide-react";
import type { SgTagRow, SportTableKind } from "../../types";
import { getClipDuration } from "../utils/tags-panel-model";

type TagDragPreviewProps = {
  count: number;
  row: SgTagRow;
  sport: SportTableKind;
  thumbnailUrl: string;
};

const cleanDetail = (value: string) => (value.trim() === "--" || value.trim() === "-" ? "" : value.trim());

const TagDragPreview = ({ count, row, sport, thumbnailUrl }: TagDragPreviewProps) => {
  const subtitle = [row.player, row.groupValue].map(cleanDetail).filter(Boolean).join(" · ");
  const detail = cleanDetail(row.primaryDetail);

  return (
    <div aria-hidden="true" className="w-[350px] p-6">
      <div className="relative flex h-[60px] -rotate-2 items-center gap-2.5 rounded-xl border border-[#38bdf8] bg-[#202729] p-2 text-white shadow-[0_12px_28px_rgba(0,0,0,0.55),0_0_0_2px_rgba(56,189,248,0.25)]">
        <div className="flex h-10 w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#343c40]">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <Video className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold leading-5">{cleanDetail(row.action) || detail || "Tag"}</div>
          <div className="flex min-w-0 items-center gap-1 text-[10px] leading-4">
            {subtitle && <span className="truncate text-[#a3a3a3]">{subtitle}</span>}
            {subtitle && detail && <span className="text-[#a3a3a3]">·</span>}
            {detail && <span className="max-w-[85px] shrink-0 truncate text-[#38bdf8]">{detail}</span>}
          </div>
        </div>
        <span className="shrink-0 rounded bg-black/50 px-1.5 py-0.5 text-[10px] tabular-nums text-gray-200">
          {getClipDuration(row, sport)}
        </span>
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#93c5fd] bg-[#4b97ed] px-1 text-[11px] font-medium text-white">
          {count}
        </span>
      </div>
    </div>
  );
};

export const setTagDragPreview = (dataTransfer: DataTransfer, props: TagDragPreviewProps) => {
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    // The preview must be mounted before the browser captures the drag image.
    flushSync(() => root.render(<TagDragPreview {...props} />));
    dataTransfer.setDragImage(container, 42, 48);
  } finally {
    // Keep it mounted through the native snapshot, then remove it before painting.
    requestAnimationFrame(() => {
      root.unmount();
      container.remove();
    });
  }
};
