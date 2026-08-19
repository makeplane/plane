"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  File,
  Image as ImageIcon,
  ImageOff,
  LoaderCircle,
  Video,
} from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { ETagSize, ETagVariant, Tag } from "@plane/ui";

import { useVideoDuration } from "../hooks/use-video-duration";
import type { TMediaItem } from "../types/media-library.types";
import { getDisplayMediaTitle } from "../utils/media-detail-utils";
import {
  getEventMediaContextLabel,
  getEventMediaDateLabel,
  getEventMediaDetails,
  getEventMediaMetrics,
  isEventMediaItem,
} from "../utils/media-event";

const clampProgress = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

export const MediaCard = ({
  item,
  href,
  className,
  forceThumbnail: _forceThumbnail,
  label: _label,
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
  const isEventItem = isEventMediaItem(item);
  const eventDetails = getEventMediaDetails(item);
  const eventDateLabel = getEventMediaDateLabel(item);
  const eventMetrics = getEventMediaMetrics(item);
  const eventContextLabel = getEventMediaContextLabel(item);
  const itemDescription = item.description || eventContextLabel || "";
  const displayTitle = getDisplayMediaTitle(item.title);

  useEffect(() => {
    setIsThumbnailUnavailable(!item.thumbnail);
  }, [item.thumbnail]);

  const durationLabel = useVideoDuration(item);
  const isExternal = /^https?:\/\//i.test(href);
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
  const isVideoLike = item.mediaType === "video" || item.linkedMediaType === "video";
  const LinkedTypeIcon = showLinkedTypeIndicator
    ? isEventItem
      ? Video
      : item.linkedMediaType === "video"
        ? Video
        : item.linkedMediaType === "image"
          ? ImageIcon
          : File
    : null;
  const showTranscodeBadge =
    isVideoLike &&
    Boolean(item.transcodeStatus) &&
    (item.isTranscodeActive || item.isTranscodeFailed || item.isTranscodeComplete);
  const transcodeProgress = clampProgress(item.transcodeProgress);
  const TranscodeIcon = item.isTranscodeFailed ? AlertTriangle : item.isTranscodeComplete ? CheckCircle2 : LoaderCircle;
  const transcodeBadgeClass = item.isTranscodeFailed
    ? "bg-red-500/15 text-red-500"
    : item.isTranscodeComplete
      ? "bg-green-500/15 text-green-500"
      : "bg-custom-primary-100/15 text-custom-primary-100";
  const transcodeBadgeLabel = item.isTranscodeActive
    ? `${item.transcodeLabel ?? "Uploading"} ${transcodeProgress > 0 ? `${transcodeProgress}%` : ""}`.trim()
    : item.transcodeLabel;
  const isDetailDisabled = Boolean(item.isTranscodeActive);
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isDetailDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event, item);
  };

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
              alt={displayTitle}
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
                alt={displayTitle}
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
          <>
            {isThumbnailUnavailable ? (
              <div className="flex h-full w-full items-center justify-center text-custom-text-300">
                <File className="h-6 w-6" strokeWidth={3.5} />
              </div>
            ) : (
              <Image
                src={item.thumbnail}
                alt={displayTitle}
                width={100}
                height={100}
                loading="lazy"
                onError={() => setIsThumbnailUnavailable(true)}
                className="h-full w-full object-contain p-6 transition-transform duration-300"
              />
            )}
          </>
        )}
        {item.isTranscodeActive ? (
          <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-custom-background-100/70">
            <div
              className="h-full bg-custom-primary-100 transition-all duration-300"
              style={{ width: `${transcodeProgress}%` }}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{displayTitle}</div>
        </div>
        {itemDescription ? (
          <div className="line-clamp-2 text-[11px] text-custom-text-300">{itemDescription}</div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-custom-text-300">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-custom-text-300" />
            {isEventItem ? eventDateLabel || item.createdAt : item.createdAt}
          </span>
          {item.mediaType === "video" && !isEventItem ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-custom-text-300" />
              {durationLabel}
            </span>
          ) : null}
          {isEventItem ? (
            eventMetrics.map((metric) => <span key={metric}>{metric}</span>)
          ) : (
            <span>Views {item.views}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Tag
            variant={ETagVariant.OUTLINED}
            size={ETagSize.SM}
            className="min-h-0 rounded-full border-0 bg-custom-primary-100/20 px-2 py-1 text-[11px] font-medium text-custom-primary-100 cursor-default hover:text-custom-primary-100"
          >
            {item.primaryTag}
          </Tag>
          {isEventItem && eventDetails?.status ? (
            <span className="rounded-full border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-[11px] font-medium text-custom-text-300">
              {eventDetails.status}
            </span>
          ) : null}
          {showTranscodeBadge ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${transcodeBadgeClass}`}>
              <TranscodeIcon className={`h-3 w-3 ${item.isTranscodeActive ? "animate-spin" : ""}`} />
              {transcodeBadgeLabel}
            </span>
          ) : null}
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

  if (isDetailDisabled) {
    return (
      <div className="cursor-not-allowed text-left opacity-95" aria-disabled="true" title="Transcoding in progress">
        {cardBody}
      </div>
    );
  }

  return isExternal ? (
    <a href={href} onClick={handleLinkClick} className="text-left">
      {cardBody}
    </a>
  ) : (
    <Link href={href} onClick={handleLinkClick} className="text-left">
      {cardBody}
    </Link>
  );
};
