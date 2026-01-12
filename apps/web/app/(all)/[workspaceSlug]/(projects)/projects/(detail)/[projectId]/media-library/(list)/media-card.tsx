"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Calendar, Clock, FileText } from "lucide-react";

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
  const previewLabel =
    label ?? (item.mediaType === "image" ? "Image" : item.mediaType === "video" ? durationLabel : "Document");
  const shouldShowThumbnail = forceThumbnail || item.mediaType === "image" || isHls;

  return (
    <Link
      href={href}
      className="text-left"
      onClick={(event) => {
        onClick?.(event, item);
      }}
    >
      <div
        className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
          className ?? ""
        }`.trim()}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-custom-background-90">
          {shouldShowThumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : item.mediaType === "video" ? (
            isHls ? (
              item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-custom-text-300">
              <FileText className="h-6 w-6" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
            {previewLabel}
          </div>
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
            <span className="rounded-full bg-custom-background-90 px-2 py-0.5 text-custom-text-300">
              {item.secondaryTag}
            </span>
            <span className="rounded-full border border-custom-border-200 px-2 py-0.5 text-custom-text-300">
              {item.itemsCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
