import Image from "next/image";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Video } from "lucide-react";
import type { SgTagRow, SportTableKind } from "../../types";
import { getClipDuration } from "../utils/tags-panel-model";

type TagDragPreviewData = {
  count: number;
  row: SgTagRow;
  sport: SportTableKind;
  thumbnailUrl: string;
};

type TagDragPreviewProps = TagDragPreviewData & {
  isDarkTheme: boolean;
};

const cleanDetail = (value: string) => (value.trim() === "--" || value.trim() === "-" ? "" : value.trim());

const TagDragPreview = ({ count, isDarkTheme, row, sport, thumbnailUrl }: TagDragPreviewProps) => {
  const subtitle = [row.player, row.groupValue].map(cleanDetail).filter(Boolean).join(" · ");
  const detail = cleanDetail(row.primaryDetail);

  return (
    <div aria-hidden="true" className="w-[332px] p-4">
      <div
        className={`relative flex min-h-[62px] -rotate-2 items-center gap-2.5 rounded-xl border-2 border-[#0EA5E9] px-2.5 py-2 ${
          isDarkTheme
            ? "bg-[#202426] text-white shadow-[0_14px_30px_rgba(0,0,0,0.55)]"
            : "bg-white text-[#202124] shadow-[0_14px_30px_rgba(15,23,42,0.22)]"
        }`}
      >
        <div
          className={`flex h-11 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded ${
            isDarkTheme ? "bg-[#343c40]" : "bg-[#e5e7eb]"
          }`}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt=""
              width={72}
              height={44}
              className="h-full w-full object-cover"
              draggable={false}
              unoptimized
            />
          ) : (
            <Video className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-5">
            {cleanDetail(row.action) || detail || "Tag"}
          </div>
          <div className="flex min-w-0 items-center gap-1 text-[11px] leading-4">
            {subtitle && (
              <span className={`truncate ${isDarkTheme ? "text-[#a3a3a3]" : "text-[#737373]"}`}>{subtitle}</span>
            )}
            {subtitle && detail && <span className={isDarkTheme ? "text-[#a3a3a3]" : "text-[#737373]"}>·</span>}
            {detail && <span className="max-w-[76px] shrink-0 truncate text-[#0EA5E9]">{detail}</span>}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-1 text-[11px] tabular-nums ${
            isDarkTheme ? "bg-[#111315] text-[#e5e5e5]" : "bg-[#f1f3f5] text-[#404040]"
          }`}
        >
          {getClipDuration(row, sport)}
        </span>
        <span
          className={`absolute -right-2.5 -top-2.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 bg-[#4B97ED] px-1 text-xs font-semibold text-white shadow-sm ${
            isDarkTheme ? "border-[#202426]" : "border-white"
          }`}
        >
          {count}
        </span>
      </div>
    </div>
  );
};

const isCurrentThemeDark = () => {
  const theme = document.documentElement.dataset.theme ?? "";
  if (theme.includes("dark")) return true;
  if (theme.includes("light")) return false;

  const customColorScheme = getComputedStyle(document.documentElement).getPropertyValue("--color-scheme").trim();
  if (customColorScheme) return customColorScheme === "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const setTagDragPreview = (dataTransfer: DataTransfer, props: TagDragPreviewData) => {
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
    flushSync(() => root.render(<TagDragPreview {...props} isDarkTheme={isCurrentThemeDark()} />));
    dataTransfer.setDragImage(container, 30, 34);
  } catch (error) {
    // Fall back to the browser's default drag preview when custom rendering fails.
    console.error("Failed to create the tag drag preview.", error);
  } finally {
    // Keep it mounted through the native snapshot, then remove it before painting.
    requestAnimationFrame(() => {
      root.unmount();
      container.remove();
    });
  }
};
