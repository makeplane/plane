"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { Swiper as SwiperInstance } from "swiper";
import { Navigation, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { MediaCard } from "../components/media-card";
import { MediaListView } from "../components/media-list-view";
import { useMediaLibraryItems } from "../hooks/use-media-library-items";
import { useMediaLibrary } from "../state/media-library-context";
import type { TMediaItem, TMediaSection } from "../types";
import { groupMediaItemsByTag, resolveMediaItemActionHref } from "../utils/media-items";
import { buildMetaFilterConfigs, collectMetaFilterOptions } from "../utils/media-library-filters";

const MediaRow = ({ section, getItemHref }: { section: TMediaSection; getItemHref: (item: TMediaItem) => string }) => {
  const rowId = useId().replace(/:/g, "");
  const prevId = `media-prev-${rowId}`;
  const nextId = `media-next-${rowId}`;
  const scrollbarId = `media-scrollbar-${rowId}`;
  const hasScrollableItems = section.items.length > 1;
  const [showNavigation, setShowNavigation] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const handleSwiperUpdate = (swiper: SwiperInstance) => {
    const isScrollable = !swiper.isLocked;
    setShowNavigation(isScrollable);
    setCanScrollLeft(isScrollable && !swiper.isBeginning);
    setCanScrollRight(isScrollable && !swiper.isEnd);
  };

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
          allowTouchMove
          watchOverflow
          onSwiper={handleSwiperUpdate}
          onResize={handleSwiperUpdate}
          onSlidesLengthChange={handleSwiperUpdate}
          onSlideChange={handleSwiperUpdate}
          onTransitionEnd={handleSwiperUpdate}
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
              className={`absolute left-0 top-[40%] z-10 flex -translate-y-1/2 -translate-x-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100 ${
                showNavigation && canScrollLeft ? "" : "hidden"
              }`}
              aria-label={`Scroll ${section.title} left`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              id={nextId}
              type="button"
              className={`absolute right-0 top-[40%] z-10 flex -translate-y-1/2 translate-x-1/2 rounded-full border border-custom-border-200 bg-custom-background-100 p-2 text-custom-text-300 shadow-sm hover:text-custom-text-100 ${
                showNavigation && canScrollRight ? "" : "hidden"
              }`}
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

const BLOCKED_DOCUMENT_FORMATS = new Set(["doc", "docx", "txt","csv", "pptx"]);

const MediaLibraryListPage = observer(() => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { libraryVersion, mediaFilters, setMediaFilterConfigs } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const filterConditions = useMemo(
    () =>
      mediaFilters.allConditionsForDisplay.map(({ property, operator, value }) => ({
        property,
        operator,
        value,
      })),
    [mediaFilters.allConditionsForDisplay]
  );
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion, {
    query,
    filters: filterConditions,
    formats: "thumbnail",
  });
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const filteredItems = useMemo(
    () =>
      libraryItems.filter((item) => {
        const format = item.format?.toLowerCase() ?? "";
        const linkedFormat = item.linkedFormat?.toLowerCase() ?? "";
        if (BLOCKED_DOCUMENT_FORMATS.has(format)) return false;
        if (format === "thumbnail" && linkedFormat && BLOCKED_DOCUMENT_FORMATS.has(linkedFormat)) return false;
        return true;
      }),
    [libraryItems]
  );
  const mediaSections = useMemo(() => groupMediaItemsByTag(filteredItems), [filteredItems]);
  // console.log("Media Sections:", libraryItems);
  const filterConfigs = useMemo(
    () => buildMetaFilterConfigs(collectMetaFilterOptions(filteredItems), operatorConfigs),
    [filteredItems, operatorConfigs]
  );

  useEffect(() => {
    setMediaFilterConfigs(filterConfigs);
  }, [filterConfigs, setMediaFilterConfigs]);

  const getItemHref = (item: TMediaItem) => {
    if (item.link) {
      return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.link)}`;
    }
    const actionHref = resolveMediaItemActionHref(item);
    if (actionHref) {
      return actionHref;
    }
    return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;
  };

  const showSkeleton = isLoading && filteredItems.length === 0;
  const getSectionHref = (section: TMediaSection) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "list");
    const paramsString = params.toString();
    return `./section/${encodeURIComponent(section.title)}${paramsString ? `?${paramsString}` : ""}`;
  };

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
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-custom-background-90" />
                    <div className="h-3 w-16 rounded bg-custom-background-90" />
                  </div>
                  <div className="flex gap-4 overflow-hidden pb-3">
                    {Array.from({ length: 5 }).map((__, cardIndex) => (
                      <div
                        key={`skeleton-card-${cardIndex}`}
                        className="w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px]"
                      >
                        <div className="aspect-[16/9] w-full rounded-lg bg-custom-background-90" />
                        <div className="mt-2 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-custom-background-90" />
                          <div className="h-3 w-2/3 rounded bg-custom-background-80" />
                          <div className="flex gap-2">
                            <div className="h-4 w-14 rounded-full bg-custom-background-90" />
                            <div className="h-4 w-20 rounded-full bg-custom-background-90" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <hr className="border-0 border-t border-custom-border-300/60" />
                </section>
              ))}
            </div>
          )
        ) : mediaSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
            No media matches your search.
          </div>
        ) : viewMode === "list" ? (
          <MediaListView sections={mediaSections} getItemHref={getItemHref} getSectionHref={getSectionHref} />
        ) : (
          mediaSections.map((section) => (
            <MediaRow key={section.title} section={section} getItemHref={getItemHref} />
          ))
        )}
      </div>
    </div>
  );
});

export default MediaLibraryListPage;
