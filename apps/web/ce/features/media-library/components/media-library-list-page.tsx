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
import { useMediaLibraryItems } from "../hooks/use-media-library-items";
import { useMediaLibrary } from "../store/media-library-context";
import type { TMediaItem, TMediaSection } from "../types/media-library.types";
import { groupMediaItemsByTag, resolveMediaItemActionHref } from "../utils/media-items";
import { buildMetaFilterConfigs, collectMetaFilterOptions } from "../utils/media-library-filters";
import { MediaCard } from "./media-card";
import { MediaLibraryEmptyState } from "./media-library-empty-state";
import { MediaListView } from "./media-list-view";

const MAIN_QUERY_PARAM_KEY = "q_main";
const MAIN_VIEW_PARAM_KEY = "view_main";
const MAIN_GROUP_PARAM_KEY = "group_main";
const GROUPED_MEDIA_GROUP_VALUE = "grouped";
const SECTION_VIEW_PARAM_KEY = "view_section";
const LEGACY_VIEW_PARAM_KEY = "view";

const MediaRow = ({
  section,
  getItemHref,
  getSectionHref,
}: {
  section: TMediaSection;
  getItemHref: (item: TMediaItem) => string;
  getSectionHref?: (section: TMediaSection) => string;
}) => {
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
        {getSectionHref ? (
          <Link
            href={getSectionHref(section)}
            className="text-xs uppercase tracking-wider text-custom-text-300 hover:text-custom-text-100"
          >
            View all
          </Link>
        ) : null}
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

const ALLOWED_DOCUMENT_FORMATS = new Set([
  "docx",
  "pdf",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "json",
  "md",
  "log",
  "yaml",
  "yml",
  "xml",
]);

const normalizeDocumentFormat = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/^\./, "");
  if (!normalized) return "";
  if (normalized.includes("/")) {
    const [, subtype = ""] = normalized.split("/");
    if (!subtype || subtype === "octet-stream") return "";
    if (subtype === "vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
    if (subtype === "msword") return "doc";
    if (subtype === "vnd.ms-excel") return "xls";
    if (subtype === "vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
    if (subtype === "csv") return "csv";
    if (subtype === "plain") return "txt";
    if (subtype === "json") return "json";
    if (subtype === "xml") return "xml";
    if (subtype === "pdf") return "pdf";
    if (subtype === "x-yaml" || subtype === "yaml") return "yaml";
    if (subtype === "x-markdown" || subtype === "markdown") return "md";
    return subtype.replace(/^x-/, "");
  }
  return normalized;
};

const resolveDocumentFormat = (item: TMediaItem) => {
  const linkedFormat = normalizeDocumentFormat(item.linkedFormat ?? "");
  if (linkedFormat) return linkedFormat;
  const meta = item.meta as Record<string, unknown> | undefined;
  const metaFileType =
    typeof meta?.file_type === "string" ? meta.file_type : typeof meta?.fileType === "string" ? meta.fileType : "";
  const normalizedMetaType = normalizeDocumentFormat(metaFileType);
  if (normalizedMetaType) return normalizedMetaType;
  const format = normalizeDocumentFormat(item.format ?? "");
  return format !== "thumbnail" ? format : "";
};

const MediaLibraryListPage = observer(() => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { libraryVersion, mediaFilters, setMediaFilterConfigs } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get(MAIN_QUERY_PARAM_KEY) ?? "").trim();
  const viewMode = searchParams.get(MAIN_VIEW_PARAM_KEY) === "list" ? "list" : "grid";
  const isAllMediaView = searchParams.get(MAIN_GROUP_PARAM_KEY) !== GROUPED_MEDIA_GROUP_VALUE;
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
        const documentFormat = resolveDocumentFormat(item);
        const isDocument = item.mediaType === "document";
        const isDocumentThumbnail = item.mediaType === "image" && item.linkedMediaType === "document";
        const isAllowedDocument = !documentFormat || ALLOWED_DOCUMENT_FORMATS.has(documentFormat);
        if (isDocument) return isAllowedDocument;
        if (format === "thumbnail" && isDocumentThumbnail) return isAllowedDocument;
        return true;
      }),
    [libraryItems]
  );
  const mediaSections = useMemo(() => groupMediaItemsByTag(filteredItems), [filteredItems]);
  const visibleSections = useMemo<TMediaSection[]>(
    () => (isAllMediaView ? [{ title: "All media", items: filteredItems }] : mediaSections),
    [filteredItems, isAllMediaView, mediaSections]
  );
  // console.log("Media Sections:", libraryItems);
  const filterConfigs = useMemo(
    () => buildMetaFilterConfigs(collectMetaFilterOptions(filteredItems), operatorConfigs),
    [filteredItems, operatorConfigs]
  );
  const hasActiveFilters = query.length > 0 || mediaFilters.allConditionsForDisplay.length > 0;
  const hasVisibleItems = filteredItems.length > 0;

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
    params.delete(SECTION_VIEW_PARAM_KEY);
    params.delete(LEGACY_VIEW_PARAM_KEY);
    const paramsString = params.toString();
    return `./section/${encodeURIComponent(section.title)}${paramsString ? `?${paramsString}` : ""}`;
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col px-6 py-4">
        {showSkeleton ? (
          viewMode === "list" ? (
            <div className="flex flex-col gap-8 animate-pulse">
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
            <div className="flex flex-col gap-8 animate-pulse">
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
        ) : !hasVisibleItems ? (
          hasActiveFilters ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <div className="rounded-xl border border-dashed border-custom-border-200 bg-custom-background-100 px-6 py-8 text-center text-sm text-custom-text-300">
                No media matches your current search or filters.
              </div>
            </div>
          ) : (
            <MediaLibraryEmptyState />
          )
        ) : viewMode === "list" ? (
          <MediaListView
            sections={visibleSections}
            getItemHref={getItemHref}
            getSectionHref={isAllMediaView ? undefined : getSectionHref}
          />
        ) : isAllMediaView ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => (
              <MediaCard
                key={`all-media-${item.id}`}
                item={item}
                href={getItemHref(item)}
                forceThumbnail
                className="!w-full"
              />
            ))}
          </div>
        ) : (
          visibleSections.map((section) => (
            <MediaRow
              key={section.title}
              section={section}
              getItemHref={getItemHref}
              getSectionHref={isAllMediaView ? undefined : getSectionHref}
            />
          ))
        )}
      </div>
    </div>
  );
});

export default MediaLibraryListPage;
