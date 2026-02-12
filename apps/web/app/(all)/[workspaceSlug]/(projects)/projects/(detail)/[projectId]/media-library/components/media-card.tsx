"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, File, Image as ImageIcon, ImageOff, Video } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { ETagSize, ETagVariant, Tag } from "@plane/ui";

import { useVideoDuration } from "../hooks/use-video-duration";
import type { TMediaItem } from "../types";

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
  // console.log("Rendering MediaCard for item:", item);
  const isHls = item.mediaType === "video" && item.format.toLowerCase() === "m3u8";
  const [isThumbnailUnavailable, setIsThumbnailUnavailable] = useState(!item.thumbnail);

  useEffect(() => {
    setIsThumbnailUnavailable(!item.thumbnail);
  }, [item.thumbnail]);

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
  const shouldUseCredentials = (src: string) => {
    if (!src) return false;
    if (src.startsWith("/")) return true;
    if (!/^https?:\/\//i.test(src)) return true;
    try {
      const url = new URL(src);
      if (typeof window !== "undefined" && url.origin === window.location.origin) return true;
      if (API_BASE_URL) {
        try {
          return url.origin === new URL(API_BASE_URL).origin;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
    return false;
  };
  const useCredentials = shouldUseCredentials(item.videoSrc ?? "");
  const crossOrigin = useCredentials ? "use-credentials" : "anonymous";
  const LinkedTypeIcon = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? Video
      : item.linkedMediaType === "image"
        ? ImageIcon
        : File
    : null;

  const mediaTypeLabel =
    (item.linkedMediaType ?? item.mediaType) === "video"
      ? "Video"
      : (item.linkedMediaType ?? item.mediaType) === "image"
        ? "Image"
        : "Document";
  const MediaTypeIcon =
    (item.linkedMediaType ?? item.mediaType) === "video"
      ? Video
      : (item.linkedMediaType ?? item.mediaType) === "image"
        ? ImageIcon
        : File;
  const thumbnailUnavailableFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-custom-text-300">
      <ImageOff className="h-16 w-16" strokeWidth={2.5} />
      <span className="sr-only">Thumbnail unavailable</span>
    </div>
  );

  const cardBody = (
    <div
      className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
        className ?? ""
      }`.trim()}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-custom-background-90">
        {showLinkedTypeIndicator && LinkedTypeIcon ? (
          <span className="absolute right-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-100/80 text-custom-text-200 backdrop-blur">
            <span className="sr-only">{linkedTypeLabel}</span>
            <LinkedTypeIcon className="h-4 w-4" strokeWidth={3.5} />
          </span>
        ) : null}
        {item.mediaType === "image" ? (
          isThumbnailUnavailable ? (
            thumbnailUnavailableFallback
          ) : (
            <Image
              src={item.thumbnail}
              alt={item.title}
              width={100}
              height={100}
              loading="lazy"
              onError={() => setIsThumbnailUnavailable(true)}
              className={`h-full w-full transition-transform duration-300 ${
                isLinkedDocumentThumbnail ? "object-contain p-6" : "object-cover"
              }`}
            />
          )
        ) : item.mediaType === "video" ? (
          isHls ? (
            isThumbnailUnavailable ? (
              thumbnailUnavailableFallback
            ) : (
              <Image
                src={item.thumbnail}
                alt={item.title}
                width={100}
                height={100}
                loading="lazy"
                onError={() => setIsThumbnailUnavailable(true)}
                className="h-full w-full object-cover transition-transform duration-300 "
              />
            )
          ) : (
            <video
              src={item.videoSrc ?? ""}
              poster={item.thumbnail}
              muted
              loop
              playsInline
              preload="metadata"
              crossOrigin={crossOrigin}
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
        {item.description ? (
          <div className="line-clamp-2 text-[11px] text-custom-text-300">{item.description}</div>
        ) : null}
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
          <Tag
            variant={ETagVariant.OUTLINED}
            size={ETagSize.SM}
            className="min-h-0 rounded-full border-0 bg-custom-primary-100/20 px-2 py-1 mt-2 text-[11px] font-medium text-custom-primary-100 cursor-default hover:text-custom-primary-100"
          >
            {item.primaryTag}
          </Tag>
          {/* <span className="inline-flex items-center gap-1 rounded-full bg-custom-background-90 px-2 py-0.5 text-custom-text-300">
            <MediaTypeIcon className="h-3 w-3" strokeWidth={3.5} />
            {mediaTypeLabel}
          </span> */}
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
