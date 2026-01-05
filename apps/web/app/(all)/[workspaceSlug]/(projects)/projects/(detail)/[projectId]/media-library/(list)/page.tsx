"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navigation, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Calendar, Clock, FileText } from "lucide-react";

import type { TMediaItem } from "./media-items";
import { MEDIA_ITEMS } from "./media-items";
import { useMediaLibrary } from "./media-library-context";
import { MediaListView } from "./media-list-view";

type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

const MediaCard = ({
  item,
  className,
}: {
  item: TMediaItem;
  className?: string;
}) => (
  <Link href={`./${encodeURIComponent(item.id)}`} className="text-left">
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
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : item.mediaType === "video" ? (
          <video
            src={item.videoSrc ?? ""}
            poster={item.thumbnail}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-custom-text-300">
            <FileText className="h-6 w-6" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
          {item.mediaType === "image" ? "Image" : item.mediaType === "video" ? item.duration : "Document"}
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
          {/* <Star className="h-3.5 w-3.5 text-custom-primary-100" /> */}
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
    </div>
  </Link>
);

const MediaRow = ({
  section,
  isExpanded,
  onToggleViewAll,
}: {
  section: TMediaSection;
  isExpanded: boolean;
  onToggleViewAll: () => void;
}) => {
  const rowId = useId().replace(/:/g, "");
  const prevId = `media-prev-${rowId}`;
  const nextId = `media-next-${rowId}`;
  const scrollbarId = `media-scrollbar-${rowId}`;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
        <button
          type="button"
          onClick={onToggleViewAll}
          className="text-xs uppercase tracking-wider text-custom-text-300 hover:text-custom-text-100"
        >
          {isExpanded ? "Show less" : "View all"}
        </button>
      </div>
      {isExpanded ? (
        <div className="flex flex-wrap gap-4">
          {section.items.map((item) => (
            <MediaCard key={`${section.title}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <>
          <div className="relative">
            <Swiper
              modules={[Navigation, Scrollbar]}
              slidesPerView="auto"
              spaceBetween={16}
              navigation={{ prevEl: `#${prevId}`, nextEl: `#${nextId}` }}
              scrollbar={{ el: `#${scrollbarId}`, draggable: true }}
              watchOverflow
              className="media-swiper pb-3"
            >
              {section.items.map((item) => (
                <SwiperSlide key={item.id} className="!w-auto">
                  <MediaCard item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
            <button
              id={prevId}
              type="button"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100 sm:flex"
              aria-label={`Scroll ${section.title} left`}
            >
              &lsaquo;
            </button>
            <button
              id={nextId}
              type="button"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100 sm:flex"
              aria-label={`Scroll ${section.title} right`}
            >
              &rsaquo;
            </button>
          </div>
          <div id={scrollbarId} className="hidden" />
        </>
      )}
      <hr className="border-0 border-t border-custom-border-300/60" />
    </section>
  );
};

export default function MediaLibraryListPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { uploadedItems } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const allItems = useMemo(() => [...uploadedItems, ...MEDIA_ITEMS], [uploadedItems]);
  const mediaCount = useMemo(
    () => allItems.length,
    [allItems]
  );
  const uploadedSection = useMemo(
    () => (uploadedItems.length > 0 ? [{ title: "Uploads", items: uploadedItems }] : []),
    [uploadedItems]
  );
  const mediaSections = useMemo(
    () => [
      ...uploadedSection,
      { title: "Featured", items: MEDIA_ITEMS.slice(0, 6) },
      { title: "Recommended", items: MEDIA_ITEMS.slice(3, 9) },
      { title: "Latest", items: MEDIA_ITEMS.slice(1, 7) },
    ],
    [uploadedSection]
  );
  const filteredSections = useMemo(() => {
    if (!query) return mediaSections;
    return mediaSections.map((section) => ({
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
    })).filter((section) => section.items.length > 0);
  }, [mediaSections, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* <h1 className="text-lg font-semibold text-custom-text-100">Sports Media Library</h1> */}
        </div>
        <div className="text-xs text-custom-text-300">{mediaCount} items</div>
      </div>

      <div className="flex flex-col gap-8 p-3">
        {filteredSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
            No media matches your search.
          </div>
        ) : viewMode === "list" ? (
          <MediaListView sections={filteredSections} />
        ) : (
          filteredSections.map((section) => (
            <MediaRow
              key={section.title}
              section={section}
              isExpanded={!!expandedSections[section.title]}
              onToggleViewAll={() =>
                setExpandedSections((prev) => ({
                  ...prev,
                  [section.title]: !prev[section.title],
                }))
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
