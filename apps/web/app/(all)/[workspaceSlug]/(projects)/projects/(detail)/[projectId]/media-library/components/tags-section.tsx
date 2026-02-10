"use client";

import { useState, type ReactNode } from "react";
import { FileText, Image as ImageIcon, Video, X } from "lucide-react";
import type { TMediaItem } from "../types";
import { useMember } from "@/hooks/store/use-member";

type TagsSectionProps = {
  item: TMediaItem;
  onPlay: () => void;
  editable?: boolean;
  isSaving?: boolean;
  onTagsChange?: (nextTags: string[]) => void;
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

export const TagsSection = ({ item, onPlay, editable = false, isSaving = false, onTagsChange }: TagsSectionProps) => {
  const meta = item.meta ?? {};
  const oppositionName = normalizeTagValue(meta.opposition);
  const { getUserDetails } = useMember();
  const [tagDraft, setTagDraft] = useState("");
  const tagsList = Array.isArray(meta.tags) ? meta.tags : [];
  const tagMap = new Map<string, string>();

  const addTag = (label: string, value: unknown) => {
    const normalized = normalizeTagValue(value);
    if (!normalized) return;
    tagMap.set(label, normalized);
  };

  const handleAddTag = (rawValue: string) => {
    if (!onTagsChange) return;
    const parts = rawValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tagsList];
    for (const part of parts) {
      const exists = next.some((tag) => tag.toLowerCase() === part.toLowerCase());
      if (!exists) next.push(part);
    }
    onTagsChange(next);
    setTagDraft("");
  };

  const handleRemoveTag = (value: string) => {
    if (!onTagsChange) return;
    const next = tagsList.filter((tag) => tag.toLowerCase() !== value.toLowerCase());
    onTagsChange(next);
  };

  if (editable) {
    return (
      <div className="w-full self-start lg:max-w-[720px]">
        <div className="text-[11px] text-custom-text-300">
          <div className="mb-1">Tags</div>
          <div className="flex min-h-[34px] w-full flex-wrap items-center gap-2 rounded-md   px-2 py-1.5">
            {tagsList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-custom-primary-100/30 bg-custom-primary-100/15 px-2 py-0.5 text-[11px] font-medium text-custom-primary-100"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-custom-primary-100/80 hover:text-custom-primary-100"
                  disabled={isSaving}
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  handleAddTag(tagDraft);
                }
              }}
              placeholder={tagsList.length === 0 ? "Add tags" : ""}
              className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-[11px] text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
              disabled={isSaving}
            />
          </div>
          <div className="mt-1 text-[10px] text-custom-text-300">Press comma or Enter to add.</div>
        </div>
      </div>
    );
  }

  addTag("Category", meta.category);
  addTag("Sport", meta.sport);
  addTag("Program", meta.program);
  addTag("Level", meta.level);
  addTag("Season", meta.season);
  addTag("Opposition", oppositionName);
  addTag("Source", meta.source);
  const createdByValue = meta.created_by ?? meta.createdBy ?? item.author;
  const createdByLabel =
    typeof createdByValue === "string"
      ? (getUserDetails(createdByValue)?.display_name ?? createdByValue)
      : createdByValue;
  addTag("Created by", createdByLabel);
  addTag("File type", meta.file_type ?? meta.fileType ?? item.format);

  if (tagsList.length > 0 && !editable) {
    addTag("Tags", tagsList);
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
