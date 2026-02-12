"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { File, Image, ImageOff, Video } from "lucide-react";
import { useVideoDuration } from "../hooks/use-video-duration";
import type { TMediaItem, TMediaSection } from "../types";

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
  const [isThumbnailUnavailable, setIsThumbnailUnavailable] = useState(!item.thumbnail);

  useEffect(() => {
    setIsThumbnailUnavailable(!item.thumbnail);
  }, [item.thumbnail]);

  const typeLabel = getItemTypeLabel ? getItemTypeLabel(item) : (item.linkedMediaType ?? item.mediaType);
  const showLinkedTypeIndicator = item.mediaType === "image" && Boolean(item.link) && Boolean(item.linkedMediaType);
  const isLinkedDocumentThumbnail = item.mediaType === "image" && item.linkedMediaType === "document";
  const linkedTypeLabel = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? "Video"
      : item.linkedMediaType === "image"
        ? "Image"
        : "Document"
    : "";
  const LinkedTypeIcon = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? Video
      : item.linkedMediaType === "image"
        ? Image
        : File
    : null;
  const thumbnailUnavailableFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-custom-text-300">
      <ImageOff className="h-6 w-6" strokeWidth={2.5} />
      <span className="sr-only">Thumbnail unavailable</span>
    </div>
  );
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
        {!isThumbnailUnavailable ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            onError={() => setIsThumbnailUnavailable(true)}
            className={`h-full w-full ${isLinkedDocumentThumbnail ? "object-contain p-3" : "object-cover"}`}
          />
        ) : (
          thumbnailUnavailableFallback
        )}
        {showLinkedTypeIndicator && LinkedTypeIcon ? (
          <span className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-custom-background-100/80 text-custom-text-300 backdrop-blur">
            <span className="sr-only">{linkedTypeLabel}</span>
            <LinkedTypeIcon className="h-3.5 w-3.5" strokeWidth={3.5} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
        {item.description ? (
          <div className="line-clamp-1 text-[11px] text-custom-text-300">{item.description}</div>
        ) : null}
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
  getSectionHref,
}: {
  section: TMediaSection;
  getItemHref?: (item: TMediaItem) => string;
  onItemClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
  getItemTypeLabel?: (item: TMediaItem) => string;
  getSectionHref?: (section: TMediaSection) => string;
}) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
      {getSectionHref ? (
        <Link
          href={getSectionHref(section)}
          className="text-xs uppercase tracking-wider text-custom-text-300 hover:text-custom-text-100"
        >
          View all
        </Link>
      ) : null}
    </div>
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
  getSectionHref,
}: {
  sections: TMediaSection[];
  getItemHref?: (item: TMediaItem) => string;
  onItemClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
  getItemTypeLabel?: (item: TMediaItem) => string;
  getSectionHref?: (section: TMediaSection) => string;
}) => (
  <div className="flex flex-col gap-8 p-10">
    {sections.map((section) => (
      <MediaListSection
        key={section.title}
        section={section}
        getItemHref={getItemHref}
        onItemClick={onItemClick}
        getItemTypeLabel={getItemTypeLabel}
        getSectionHref={getSectionHref}
      />
    ))}
  </div>
);
