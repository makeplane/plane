"use client";

import type { ReactNode } from "react";
import { FileText, Image as ImageIcon, Video } from "lucide-react";
import type { TMediaItem } from "../(list)/media-items";

type TagsSectionProps = {
  item: TMediaItem;
  onPlay: () => void;
};

const normalizeTagValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeTagValue(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const maybeName = (value as Record<string, unknown>)?.name;
    if (typeof maybeName === "string" && maybeName.trim()) return maybeName.trim();
  }
  return "";
};

const TagPill = ({ label, value }: { label: string; value: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-custom-border-200 bg-custom-background-100 px-2.5 py-1 text-[11px] text-custom-text-300">
    <span className="text-custom-text-400">{label}:</span>
    <span className="text-custom-text-100">{value}</span>
  </span>
);

const buildPreview = (item: TMediaItem, onPlay: () => void): ReactNode => {
  if (item.mediaType === "video") {
    return (
      <button
        type="button"
        onClick={onPlay}
        className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100 text-left"
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[10px] text-custom-text-300">
            <Video className="h-4 w-4" />
            <span>Play preview</span>
          </div>
        )}
      </button>
    );
  }

  if (item.mediaType === "image") {
    return item.thumbnail ? (
      <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100">
        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
      </div>
    ) : (
      <div className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 text-[10px] text-custom-text-300">
        <ImageIcon className="h-4 w-4" />
        <span>No preview</span>
      </div>
    );
  }

  return item.thumbnail ? (
    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100">
      <img src={item.thumbnail} alt={item.title} className="h-14 w-14 object-contain" />
    </div>
  ) : (
    <div className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-custom-border-200 bg-custom-background-100 text-[10px] text-custom-text-300">
      <FileText className="h-4 w-4" />
      <span>No preview</span>
    </div>
  );
};

export const TagsSection = ({ item, onPlay }: TagsSectionProps) => {
  const meta = item.meta ?? {};
  const oppositionName = normalizeTagValue(meta.opposition);
  const tagMap = new Map<string, string>();

  const addTag = (label: string, value: unknown) => {
    const normalized = normalizeTagValue(value);
    if (!normalized) return;
    tagMap.set(label, normalized);
  };

  addTag("Category", meta.category);
  addTag("Sport", meta.sport);
  addTag("Program", meta.program);
  addTag("Level", meta.level);
  addTag("Season", meta.season);
  addTag("Opposition", oppositionName);
  addTag("Source", meta.source);
  addTag("Created by", meta.created_by ?? meta.createdBy ?? item.author);
  addTag("File type", meta.file_type ?? meta.fileType ?? item.format);

  if (Array.isArray(meta.tags)) {
    addTag("Tags", meta.tags);
  }

  const tags = Array.from(tagMap.entries());

  return (
    <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
      <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">Tags</div>
      <div className="grid gap-4 px-4 py-3 sm:grid-cols-[160px_1fr]">
        {buildPreview(item, onPlay)}
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map(([label, value]) => <TagPill key={label} label={label} value={value} />)
          ) : (
            <div className="text-xs text-custom-text-300">No tags available.</div>
          )}
        </div>
      </div>
    </div>
  );
};
