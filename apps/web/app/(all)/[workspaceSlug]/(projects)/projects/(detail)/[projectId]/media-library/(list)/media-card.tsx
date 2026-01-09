"use client";

import Link from "next/link";
import { Calendar, FileText } from "lucide-react";

import type { TMediaItem } from "./media-items";

export const MediaCard = ({ item, href, className }: { item: TMediaItem; href: string; className?: string }) => {
<<<<<<< HEAD
  const category =
    typeof item.meta?.category === "string" && item.meta.category.trim() ? item.meta.category : item.primaryTag;
  const typeLabel = item.mediaType === "image" ? "Image" : item.mediaType === "video" ? "Video" : "Document";
=======
  const isHls = item.mediaType === "video" && item.format.toLowerCase() === "m3u8";
>>>>>>> feat/implement-upload

  return (
    <Link href={href} className="text-left">
      <div
        className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
          className ?? ""
        }`.trim()}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-custom-background-90">
          {item.mediaType === "image" ? (
            <img
              src={item.thumbnail}
              alt={item.title}
<<<<<<< HEAD
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : item.mediaType === "video" ? (
            <video
              src={item.videoSrc ?? ""}
              poster={item.thumbnail}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
=======
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
>>>>>>> feat/implement-upload
          ) : (
            <div className="flex h-full w-full items-center justify-center text-custom-text-300">
              <FileText className="h-6 w-6" />
            </div>
          )}
<<<<<<< HEAD
        </div>
        <div className="mt-2 space-y-1 text-[11px] text-custom-text-300">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-custom-primary-100/20 px-2 py-0.5 text-custom-primary-100">
              {category}
            </span>
            <span className="rounded-full border border-custom-border-200 px-2 py-0.5 text-custom-text-300">
              {typeLabel}
            </span>
            <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-custom-text-300" />
            <span>{item.createdAt}</span>
          </div>
          </div>
        </div>
=======
          <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
            {item.mediaType === "image" ? "Image" : item.mediaType === "video" ? item.duration : "Document"}
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
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-custom-text-300" />
              {item.duration}
            </span>
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
>>>>>>> feat/implement-upload
      </div>
    </Link>
  );
};
