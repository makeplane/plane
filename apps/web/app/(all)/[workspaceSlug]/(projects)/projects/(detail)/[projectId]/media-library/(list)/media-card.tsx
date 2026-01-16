"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Calendar, Clock, File, Image, Video } from "lucide-react";

import type { TMediaItem } from "./media-items";
import { useVideoDuration } from "./use-video-duration";

export const MediaCard = ({
  item,
  href,
  className,
  forceThumbnail,
  label,
  onClick,
}: {
  item: TMediaItem;
  href: string;
  className?: string;
  forceThumbnail?: boolean;
  label?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
}) => {
  const isHls = item.mediaType === "video" && item.format.toLowerCase() === "m3u8";
  const durationLabel = useVideoDuration(item);
  const isExternal = /^https?:\/\//i.test(href);
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

  const mediaTypeLabel = (item.linkedMediaType ?? item.mediaType) === "video"
    ? "Video"
    : (item.linkedMediaType ?? item.mediaType) === "image"
      ? "Image"
      : "Document";
  const MediaTypeIcon =
    (item.linkedMediaType ?? item.mediaType) === "video"
      ? Video
      : (item.linkedMediaType ?? item.mediaType) === "image"
        ? Image
        : File;

  const cardBody = (
    <div
      className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
        className ?? ""
      }`.trim()}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-custom-background-90">
        {showLinkedTypeIndicator && LinkedTypeIcon ? (
          <span className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-100/80 text-custom-text-300 backdrop-blur">
            <span className="sr-only">{linkedTypeLabel}</span>
            <LinkedTypeIcon className="h-4 w-4" strokeWidth={3.5} />
          </span>
        ) : null}
        {item.mediaType === "image" ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className={`h-full w-full transition-transform duration-300 ${
              isLinkedDocumentThumbnail ? "object-contain p-6" : "object-cover"
            }`}
          />
        ) : item.mediaType === "video" ? (
          isHls ? (
            item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 "
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-custom-text-300">Stream</div>
            )
          ) : (
            <video
              src={item.videoSrc ?? ""}
              poster={item.thumbnail}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-300 "
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-custom-text-300">
            <File className="h-6 w-6" strokeWidth={3.5} />
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-custom-text-300">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-custom-text-300" />
            {item.createdAt}
          </span>
          {item.mediaType === "video" ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-custom-text-300" />
              {durationLabel}
            </span>
          ) : null}
          <span>Views {item.views}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full bg-custom-primary-100/20 px-2 py-0.5 text-custom-primary-100">
            {item.primaryTag}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-custom-background-90 px-2 py-0.5 text-custom-text-300">
            <MediaTypeIcon className="h-3 w-3" strokeWidth={3.5} />
            {mediaTypeLabel}
          </span>
          {/* <span className="rounded-full border border-custom-border-200 px-2 py-0.5 text-custom-text-300">
            {item.itemsCount}
          </span> */}
        </div>
      </div>
    </div>
  );

  return isExternal ? (
    <a href={href} className="text-left">
      {cardBody}
    </a>
  ) : (
    <Link href={href} className="text-left">
      {cardBody}
    </Link>
  );
};
