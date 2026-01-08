"use client";

import type { TMediaItem } from "../(list)/media-items";

type TagsSectionProps = {
  item: TMediaItem;
  onPlay: () => void;
};

export const TagsSection = ({ item, onPlay }: TagsSectionProps) => (
  <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
    <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">Tags</div>
    <div className="grid grid-cols-3 gap-2 px-4 py-3">
      {item.mediaType === "video" ? (
        <button
          type="button"
          onClick={onPlay}
          className="overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100 text-left"
        >
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="h-20 w-full object-cover" />
          ) : (
            <div className="flex h-20 items-center justify-center text-[10px] text-custom-text-300">No preview</div>
          )}
        </button>
      ) : (
        <div className="text-xs text-custom-text-300">No tags available.</div>
      )}
    </div>
  </div>
);
