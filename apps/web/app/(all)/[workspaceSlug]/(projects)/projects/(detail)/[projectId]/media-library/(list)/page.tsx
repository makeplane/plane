"use client";

import { useEffect, useId, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Navigation, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";

import { MediaCard } from "./media-card";
import type { TMediaItem, TMediaSection } from "./media-items";
import { groupMediaItemsByTag } from "./media-items";
import { useMediaLibrary } from "./media-library-context";
import { buildMetaFilterConfigs, collectMetaFilterOptions, matchesMediaLibraryFilters } from "./media-library-filters";
import { MediaListView } from "./media-list-view";
import { useMediaLibraryItems } from "./use-media-library-items";

const MediaRow = ({ section, getItemHref }: { section: TMediaSection; getItemHref: (item: TMediaItem) => string }) => {
  const rowId = useId().replace(/:/g, "");
  const prevId = `media-prev-${rowId}`;
  const nextId = `media-next-${rowId}`;
  const scrollbarId = `media-scrollbar-${rowId}`;
  const hasScrollableItems = section.items.length > 1;

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
          navigation={hasScrollableItems ? { prevEl: `#${prevId}`, nextEl: `#${nextId}` } : undefined}
          scrollbar={{ el: `#${scrollbarId}`, draggable: true }}
          allowTouchMove={!hasScrollableItems}
          watchOverflow
          className="media-swiper pb-3"
        >
          {section.items.map((item, index) => (
            <SwiperSlide key={`${item.id}-${index}`} className="!w-auto">
              <MediaCard item={item} href={getItemHref(item)} />
            </SwiperSlide>
          ))}
        </Swiper>
        {hasScrollableItems ? (
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

const MediaLibraryListPage = observer(() => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { uploadedItems, libraryVersion, mediaFilters, setMediaFilterConfigs } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion);
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const allItems = useMemo(() => [...uploadedItems, ...libraryItems], [libraryItems, uploadedItems]);
  const uploadedSection = useMemo(
    () => (uploadedItems.length > 0 ? [{ title: "Uploads", items: uploadedItems }] : []),
    [uploadedItems]
  );
  const mediaSections = useMemo(
    () => [...uploadedSection, ...groupMediaItemsByTag(libraryItems)],
    [libraryItems, uploadedSection]
  );
  const filterConfigs = useMemo(
    () => buildMetaFilterConfigs(collectMetaFilterOptions(allItems), operatorConfigs),
    [allItems, operatorConfigs]
  );

  useEffect(() => {
    setMediaFilterConfigs(filterConfigs);
  }, [filterConfigs, setMediaFilterConfigs]);

  const filteredSections = useMemo(
    () =>
      mediaSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if (item.format !== "thumbnail") return false;
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
            const matchesQuery = !query || haystack.includes(query);
            return matchesQuery && matchesMediaLibraryFilters(item, mediaFilters.allConditionsForDisplay);
          }),
        }))
        .filter((section) => section.items.length > 0),
    [mediaFilters.allConditionsForDisplay, mediaSections, query]
  );

  const getItemHref = (item: TMediaItem) => {
    if (item.link) {
      return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.link)}`;
    }
    if ((item.action === "download" || item.action === "view") && item.fileSrc) {
      return item.fileSrc;
    }
    return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;
  };

  const showSkeleton = isLoading && allItems.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 px-6 py-4">
        {showSkeleton ? (
          viewMode === "list" ? (
            <div className="flex flex-col gap-8 p-10 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <section key={`skeleton-list-${index}`} className="flex flex-col gap-3">
                  <div className="h-4 w-32 rounded bg-custom-background-90" />
                  <div
                    className="grid w-full gap-4 rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2"
                    style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
                  >
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <div key={`skeleton-list-header-${cellIndex}`} className="h-3 rounded bg-custom-background-80" />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((__, rowIndex) => (
                      <div
                        key={`skeleton-list-row-${rowIndex}`}
                        className="grid items-center gap-4 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 py-2"
                        style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
                      >
                        <div className="h-16 w-28 rounded bg-custom-background-90" />
                        <div className="h-4 w-3/4 rounded bg-custom-background-90" />
                        <div className="h-3 w-16 rounded bg-custom-background-90" />
                        <div className="h-3 w-20 rounded bg-custom-background-90" />
                        <div className="h-3 w-16 rounded bg-custom-background-90" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-8 px-6 py-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <section key={`skeleton-grid-${sectionIndex}`} className="flex flex-col gap-3">
                  <div className="h-4 w-32 rounded bg-custom-background-90" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((__, cardIndex) => (
                      <div
                        key={`skeleton-card-${cardIndex}`}
                        className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-3"
                      >
                        <div className="aspect-[16/9] w-full rounded bg-custom-background-90" />
                        <div className="mt-3 h-4 w-3/4 rounded bg-custom-background-90" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-custom-background-90" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : filteredSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
            No media matches your search.
          </div>
        ) : viewMode === "list" ? (
          <MediaListView
            sections={filteredSections}
            getItemHref={getItemHref}
            getSectionHref={(section) => `./section/${encodeURIComponent(section.title)}?view=list`}
          />
        ) : (
          filteredSections.map((section) => (
            <MediaRow key={section.title} section={section} getItemHref={getItemHref} />
          ))
        )}
      </div>
    </div>
  );
});

export default MediaLibraryListPage;
