"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import type { TMediaItem } from "./media-items";
import { useVideoDuration } from "./use-video-duration";

type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

const MediaListRow = ({
  item,
  getItemHref,
  onItemClick,
  getItemTypeLabel,
}: {
  item: TMediaItem;
  getItemHref?: (item: TMediaItem) => string;
  onItemClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
  getItemTypeLabel?: (item: TMediaItem) => string;
}) => {
  const durationLabel = useVideoDuration(item);
  const typeLabel = getItemTypeLabel ? getItemTypeLabel(item) : item.mediaType;
  const showLinkedTypeIndicator = item.mediaType === "image" && Boolean(item.link) && Boolean(item.linkedMediaType);
  const linkedTypeLabel = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? "Video"
      : item.linkedMediaType === "image"
        ? "Image"
        : "Document"
    : "";
  return (
    <Link
      href={getItemHref ? getItemHref(item) : `./${encodeURIComponent(item.id)}`}
      onClick={(event) => {
        onItemClick?.(event, item);
      }}
      className="grid w-full items-center gap-4 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-left text-xs text-custom-text-300 hover:border-custom-border-300"
      style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
    >
      <div className="relative h-16 w-28 overflow-hidden rounded-md bg-custom-background-90">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-custom-text-300">No preview</div>
        )}
        {showLinkedTypeIndicator ? (
          <span className="absolute right-2 bottom-2 rounded-full bg-custom-background-100/80 px-2 py-0.5 text-[9px] font-semibold text-custom-text-300 backdrop-blur">
            {linkedTypeLabel}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
      </div>
      <div className="capitalize">{typeLabel}</div>
      <div>{item.createdAt}</div>
      <div>{durationLabel}</div>
    </Link>
  );
};

const MediaListSection = ({
  section,
  getItemHref,
  onItemClick,
  getItemTypeLabel,
}: {
  section: TMediaSection;
  getItemHref?: (item: TMediaItem) => string;
  onItemClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
  getItemTypeLabel?: (item: TMediaItem) => string;
}) => (
  <section className="flex flex-col gap-3">
    <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
    <div
      className="grid w-full gap-4 rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-[11px] font-semibold text-custom-text-300"
      style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
    >
      <span>Media</span>
      <span>Name</span>
      <span>Type</span>
      <span>Date</span>
      <span>Duration</span>
    </div>
    <div className="flex flex-col gap-3">
      {section.items.map((item, index) => (
        <MediaListRow
          key={`${section.title}-${item.id}-${index}`}
          item={item}
          getItemHref={getItemHref}
          onItemClick={onItemClick}
          getItemTypeLabel={getItemTypeLabel}
        />
      ))}
    </div>
  </section>
);

export const MediaListView = ({
  sections,
  getItemHref,
  onItemClick,
  getItemTypeLabel,
}: {
  sections: TMediaSection[];
  getItemHref?: (item: TMediaItem) => string;
  onItemClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
  getItemTypeLabel?: (item: TMediaItem) => string;
}) => (
  <div className="flex flex-col gap-8 p-10">
    {sections.map((section) => (
      <MediaListSection
        key={section.title}
        section={section}
        getItemHref={getItemHref}
        onItemClick={onItemClick}
        getItemTypeLabel={getItemTypeLabel}
      />
    ))}
  </div>
);
