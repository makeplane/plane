"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { File, Image, ImageOff, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import type { TMediaItem, TMediaSection } from "../types/media-library.types";
import { getDisplayMediaTitle } from "../utils/media-detail-utils";
import { getEventMediaDateLabel, isEventMediaItem } from "../utils/media-event";

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
  const [isThumbnailUnavailable, setIsThumbnailUnavailable] = useState(!item.thumbnail);
  const isEventItem = isEventMediaItem(item);
  const displayTitle = getDisplayMediaTitle(item.title);

  useEffect(() => {
    setIsThumbnailUnavailable(!item.thumbnail);
  }, [item.thumbnail]);

  // console.log("Rendering MediaListRow for item:", item);

  const typeLabel = getItemTypeLabel
    ? getItemTypeLabel(item)
    : isEventItem
      ? "event"
      : (item.linkedMediaType ?? item.mediaType);
  const dateLabel = isEventItem ? getEventMediaDateLabel(item) || item.createdAt : item.createdAt;
  const showLinkedTypeIndicator = item.mediaType === "image" && Boolean(item.link) && Boolean(item.linkedMediaType);
  const isLinkedDocumentThumbnail = item.mediaType === "image" && item.linkedMediaType === "document";
  const linkedTypeLabel = showLinkedTypeIndicator
    ? isEventItem
      ? "Video"
      : item.linkedMediaType === "video"
        ? "Video"
        : item.linkedMediaType === "image"
          ? "Image"
          : "Document"
    : "";
  const LinkedTypeIcon = showLinkedTypeIndicator
    ? isEventItem
      ? Video
      : item.linkedMediaType === "video"
        ? Video
        : item.linkedMediaType === "image"
          ? Image
          : File
    : null;
  const itemHref = getItemHref ? getItemHref(item) : `./${encodeURIComponent(item.id)}`;
  const handleItemClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onItemClick?.(event, item);
  };
  const thumbnailUnavailableFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-custom-text-300">
      <ImageOff className="h-6 w-6" strokeWidth={2.5} />
      <span className="sr-only">Thumbnail unavailable</span>
    </div>
  );

  return (
    <TableRow className="border-b border-custom-border-200 last:border-b-0 hover:bg-custom-background-80/50">
      <TableCell className="w-[140px] min-w-[140px] border-r border-custom-border-200">
        <Link href={itemHref} onClick={handleItemClick} className="block">
          <div className="relative h-16 w-28 overflow-hidden rounded-md bg-custom-background-90">
            {!isThumbnailUnavailable ? (
              <img
                src={item.thumbnail}
                alt={displayTitle}
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
        </Link>
      </TableCell>
      <TableCell className="min-w-[240px] border-r border-custom-border-200">
        <Link href={itemHref} onClick={handleItemClick} className="block min-w-0">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{displayTitle}</div>
          {item.description ? (
            <div className="line-clamp-1 text-[11px] text-custom-text-300">{item.description}</div>
          ) : null}
        </Link>
      </TableCell>
      <TableCell className="min-w-[120px] border-r border-custom-border-200 text-xs text-custom-text-300">
        <Link href={itemHref} onClick={handleItemClick} className="block capitalize">
          {typeLabel}
        </Link>
      </TableCell>
      <TableCell className="min-w-[160px] border-r border-custom-border-200 text-xs text-custom-text-300">
        <Link href={itemHref} onClick={handleItemClick} className="block">
          {dateLabel}
        </Link>
      </TableCell>
      <TableCell className="min-w-[120px] text-xs text-custom-text-300">
        <Link href={itemHref} onClick={handleItemClick} className="block">
          {item.primaryTag}
        </Link>
      </TableCell>
    </TableRow>
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
      {getSectionHref ? (
        <>
          <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>

          <Link
            href={getSectionHref(section)}
            className="text-xs uppercase tracking-wider text-custom-text-300 hover:text-custom-text-100"
          >
            View all
          </Link>
        </>
      ) : null}
    </div>
    <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px] min-w-[140px] border-r border-custom-border-200">Media</TableHead>
            <TableHead className="min-w-[240px] border-r border-custom-border-200">Name</TableHead>
            <TableHead className="min-w-[120px] border-r border-custom-border-200">Type</TableHead>
            <TableHead className="min-w-[160px] border-r border-custom-border-200">Date</TableHead>
            <TableHead className="min-w-[120px]">Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.items.map((item, index) => (
            <MediaListRow
              key={`${section.title}-${item.id}-${index}`}
              item={item}
              getItemHref={getItemHref}
              onItemClick={onItemClick}
              getItemTypeLabel={getItemTypeLabel}
            />
          ))}
        </TableBody>
      </Table>
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
  <div className="flex flex-col gap-8">
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
