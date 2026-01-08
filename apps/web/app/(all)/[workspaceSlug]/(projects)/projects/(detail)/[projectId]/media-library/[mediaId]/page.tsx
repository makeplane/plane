"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";
import type { TMediaItem } from "../(list)/media-items";
import { MEDIA_ITEMS } from "../(list)/media-items";
import { loadUploadedMediaItems } from "../(list)/media-uploads";
import { TagsSection } from "./tags-section";

const MediaDetailPage = () => {
  const { mediaId, workspaceSlug, projectId } = useParams() as {
    mediaId: string;
    workspaceSlug: string;
    projectId: string;
  };
  const [uploadedItems, setUploadedItems] = useState<TMediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadUploadedMediaItems()
      .then((items) => {
        if (isMounted) setUploadedItems(items);
      })
      .catch(() => {
        if (isMounted) setUploadedItems([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const allItems = useMemo(() => [...uploadedItems, ...MEDIA_ITEMS], [uploadedItems]);
  const item = useMemo(() => {
    if (!mediaId) return null;
    const normalizedId = decodeURIComponent(mediaId);
    return allItems.find((entry) => entry.id === normalizedId) ?? null;
  }, [allItems, mediaId]);
  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
    video.play().catch(() => undefined);
  }, []);
  if (!item) {
    return (
      <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        Media not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-3 py-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/media-library`}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs text-custom-text-300 hover:text-custom-text-100"
        >
          <ArrowLeft className="size-md h-3.2 w-3.2" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-1 py-1 text-[11px] text-custom-text-300">
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 1
            </button>
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 2
            </button>
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 3
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg  bg-custom-background-100 p-4 ">
          {item.mediaType === "video" ? (
            <div className="mx-auto h-[505px] w-100 max-w-full overflow-hidden rounded-lg border border-custom-border-200 bg-black">
              <video ref={videoRef} controls poster={item.thumbnail} className="h-full w-full object-contain">
                <source src={item.videoSrc ?? ""} type="video/mp4" />
              </video>
            </div>
          ) : item.mediaType === "image" ? (
            <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-90">
              <img src={item.thumbnail} alt={item.title} className="h-[505px] w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg border border-custom-border-200 bg-custom-background-90 text-custom-text-300">
              <div className="flex flex-col items-center gap-2 text-sm">
                <FileText className="h-8 w-8" />
                <span>No preview available for this file.</span>
              </div>
              {item.fileSrc ? (
                <a
                  href={item.fileSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-custom-border-200 px-3 py-1 text-xs text-custom-text-300 hover:text-custom-text-100"
                >
                  Open document
                </a>
              ) : null}
            </div>
          )}
          <div className="mt-4">
            <h1 className="text-lg font-semibold text-custom-text-100">{item.title}</h1>
            <p className="mt-1 text-xs text-custom-text-300">
              Uploaded by {item.author} - {item.createdAt}
            </p>
          </div>
          <hr className="border-t border-custom-border-200" />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-custom-border-200 bg-custom-background-100 p-4">
          <div className="flex items-center gap-2 rounded-full border border-custom-border-200 bg-custom-background-90 p-1 text-[11px] text-custom-text-300">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`rounded-full px-3 py-1 ${
                activeTab === "details"
                  ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
                  : "hover:text-custom-text-100"
              }`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`rounded-full px-3 py-1 ${
                activeTab === "tags"
                  ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
                  : "hover:text-custom-text-100"
              }`}
            >
              Tags
            </button>
          </div>

          {activeTab === "details" ? (
            <>
              <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                  Event details
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{item.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{item.author}</span>
                  </div>
                </div>
              </div>

              {item.mediaType === "video" ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Duration &amp; sharing
                  </div>
                  <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                    <div className="flex items-center justify-between">
                      <span>Video duration</span>
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shared with</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {item.docs.length > 0 ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Documents
                  </div>
                  <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                    {item.docs.map((doc) => (
                      <div key={doc} className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                  Team info
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                  <div className="flex items-center justify-between">
                    <span>{item.primaryTag}</span>
                    <span>{item.secondaryTag}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Items</span>
                    <span>{item.itemsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Views</span>
                    <span>{item.views}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <TagsSection item={item} onPlay={handlePlay} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaDetailPage;
