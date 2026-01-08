"use client";

import { useId, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Navigation, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MediaCard } from "./media-card";
import type { TMediaItem } from "./media-items";
import { MEDIA_ITEMS } from "./media-items";
import { useMediaLibrary } from "./media-library-context";
import { MediaListView } from "./media-list-view";

type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

const MediaRow = ({ section, getItemHref }: { section: TMediaSection; getItemHref: (item: TMediaItem) => string }) => {
  const rowId = useId().replace(/:/g, "");
  const prevId = `media-prev-${rowId}`;
  const nextId = `media-next-${rowId}`;
  const scrollbarId = `media-scrollbar-${rowId}`;
  const hasVideo = section.items.some((item) => item.mediaType === "video");

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
        <Link
          href={`./section/${encodeURIComponent(section.title)}`}
          className="text-xs uppercase tracking-wider text-custom-text-300 hover:text-custom-text-100"
        >
          View all
        </Link>
      </div>
      <div className="relative">
        <Swiper
          modules={[Navigation, Scrollbar]}
          slidesPerView="auto"
          spaceBetween={16}
          navigation={hasVideo ? { prevEl: `#${prevId}`, nextEl: `#${nextId}` } : undefined}
          scrollbar={{ el: `#${scrollbarId}`, draggable: true }}
          allowTouchMove={!hasVideo}
          watchOverflow
          className="media-swiper pb-3"
        >
          {section.items.map((item) => (
            <SwiperSlide key={item.id} className="!w-auto">
              <MediaCard item={item} href={getItemHref(item)} />
            </SwiperSlide>
          ))}
        </Swiper>
        {hasVideo ? (
          <>
            <button
              id={prevId}
              type="button"
              className="absolute left-0 top-[40%] z-10 flex -translate-y-1/2 -translate-x-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100"
              aria-label={`Scroll ${section.title} left`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              id={nextId}
              type="button"
              className="absolute right-0 top-[40%] z-10 flex -translate-y-1/2 translate-x-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100"
              aria-label={`Scroll ${section.title} right`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>
      <div id={scrollbarId} className="hidden" />
      <hr className="border-0 border-t border-custom-border-300/60" />
    </section>
  );
};

export default function MediaLibraryListPage() {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { uploadedItems } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  // const allItems = useMemo(() => [...uploadedItems, ...MEDIA_ITEMS], [uploadedItems]);
  // const mediaCount = useMemo(() => allItems.length, [allItems]);
  const uploadedSection = useMemo(
    () => (uploadedItems.length > 0 ? [{ title: "Uploads", items: uploadedItems }] : []),
    [uploadedItems]
  );
  const mediaSections = useMemo(
    () => [
      ...uploadedSection,
      { title: "Game", items: MEDIA_ITEMS.slice(0, 6) },
      { title: "Practices", items: MEDIA_ITEMS.slice(3, 9) },
      { title: "Latest", items: MEDIA_ITEMS.slice(1, 7) },
    ],
    [uploadedSection]
  );
  const filteredSections = useMemo(() => {
    if (!query) return mediaSections;
    return mediaSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const haystack = [
            item.title,
            item.author,
            item.createdAt,
            item.views.toString(),
            item.primaryTag,
            item.secondaryTag,
            item.itemsCount.toString(),
            item.docs.join(" "),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [mediaSections, query]);

  const getItemHref = (item: TMediaItem) =>
    `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;

  return (
    <div className="flex flex-col gap-8">
      {/* <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-custom-text-100">Sports Media Library</h1>
        </div>
        <div className="text-xs text-custom-text-300">{mediaCount} items</div>
      </div> */}

      <div className="flex flex-col gap-8 px-6 py-4">
        {filteredSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
            No media matches your search.
          </div>
        ) : viewMode === "list" ? (
          <MediaListView sections={filteredSections} getItemHref={getItemHref} />
        ) : (
          filteredSections.map((section) => (
            <MediaRow key={section.title} section={section} getItemHref={getItemHref} />
          ))
        )}
      </div>
    </div>
  );
}
