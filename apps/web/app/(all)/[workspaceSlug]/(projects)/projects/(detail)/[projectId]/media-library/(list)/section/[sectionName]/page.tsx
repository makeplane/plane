"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { MediaCard } from "../../../components/media-card";
import type { TMediaItem, TMediaSection } from "../../../types";
import { resolveMediaItemActionHref } from "../../../utils/media-items";
import { useMediaLibrary } from "../../../state/media-library-context";
import { buildMetaFilterConfigs, collectMetaFilterOptions } from "../../../utils/media-library-filters";
import { MediaListView } from "../../../components/media-list-view";
import { useMediaLibraryItems } from "../../../hooks/use-media-library-items";

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

const MediaLibrarySectionPage = observer(() => {
  const { workspaceSlug, projectId, sectionName } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    sectionName: string;
  };
  const { libraryVersion, mediaFilters, setMediaFilterConfigs } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const pathname = usePathname();
  const pageParam = Number(searchParams.get("page") ?? "1");
  const listPageSize = 10;
  const [gridPageSize, setGridPageSize] = useState(12);
  const pageSize = viewMode === "list" ? listPageSize : gridPageSize;
  const requestedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const decodedSection = decodeURIComponent(sectionName ?? "");
  const currentPath = useMemo(() => {
    const params = searchParams.toString();
    return params ? `${pathname}?${params}` : pathname;
  }, [pathname, searchParams]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const filterConditions = useMemo(
    () =>
      mediaFilters.allConditionsForDisplay.map(({ property, operator, value }) => ({
        property,
        operator,
        value,
      })),
    [mediaFilters.allConditionsForDisplay]
  );
  const {
    items: libraryItems,
    isLoading,
    pagination,
  } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion, {
    query,
    section: decodedSection,
    filters: filterConditions,
    formats: "thumbnail",
    page: requestedPage,
    perPage: pageSize,
  });
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
  const lastPaginationRef = useRef<typeof pagination>(null);
  const resolvedPagination = pagination ?? lastPaginationRef.current;
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const filterConfigs = useMemo(
    () => buildMetaFilterConfigs(collectMetaFilterOptions(filteredItems), operatorConfigs),
    [filteredItems, operatorConfigs]
  );

  useEffect(() => {
    if (pagination) lastPaginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    setMediaFilterConfigs(filterConfigs);
  }, [filterConfigs, setMediaFilterConfigs]);

  const section = useMemo<TMediaSection>(
    () => ({
      title: decodedSection || "Upload",
      items: filteredItems,
    }),
    [decodedSection, filteredItems]
  );
  const showSkeleton = isLoading && filteredItems.length === 0;
  const totalItems = resolvedPagination?.totalResults ?? filteredItems.length;
  const totalPages = resolvedPagination?.totalPages ?? 1;
  const currentPage = Math.min(requestedPage, totalPages);
  const showPagination = totalPages > 1;
  const paginationItems = useMemo(() => {
    if (!showPagination) return [];

    const items: Array<{ type: "page" | "ellipsis"; value?: number; key: string }> = [];
    const pages = new Set<number>();

    pages.add(1);
    pages.add(totalPages);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
      if (page > 1 && page < totalPages) pages.add(page);
    }

    if (currentPage <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }

    if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
      pages.add(totalPages - 3);
    }

    const sortedPages = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    let previousPage = 0;
    for (const page of sortedPages) {
      if (previousPage && page - previousPage > 1) {
        items.push({ type: "ellipsis", key: `ellipsis-${previousPage}-${page}` });
      }
      items.push({ type: "page", value: page, key: `page-${page}` });
      previousPage = page;
    }

    return items;
  }, [currentPage, showPagination, totalPages]);

  useEffect(() => {
    if (viewMode !== "grid") return;

    const container = containerRef.current;
    const grid = gridRef.current;
    if (!container || !grid) return;
    const parent = container.parentElement;
    if (!parent) return;

    let frame = 0;
    const scheduleMeasure = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        const sampleCard = grid.firstElementChild as HTMLElement | null;
        if (!sampleCard) return;

        const parentHeight = parent.clientHeight;
        if (!parentHeight) return;

        const gridStyles = window.getComputedStyle(grid);
        const gridColumns = gridStyles.gridTemplateColumns.split(" ").filter((value) => value.trim().length > 0);
        const columnCount = Math.max(1, gridColumns.length);
        const rowGap = parseFloat(gridStyles.rowGap || gridStyles.gap || "0") || 0;

        const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0;
        const paginationHeight = paginationRef.current?.getBoundingClientRect().height ?? 0;
        const containerStyles = window.getComputedStyle(container);
        const paddingTop = parseFloat(containerStyles.paddingTop || "0") || 0;
        const paddingBottom = parseFloat(containerStyles.paddingBottom || "0") || 0;

        const availableHeight = parentHeight - headerHeight - paginationHeight - paddingTop - paddingBottom;
        if (availableHeight <= 0) return;

        const cardHeight = sampleCard.getBoundingClientRect().height;
        if (!cardHeight) return;

        const rowHeight = cardHeight + rowGap;
        const rows = Math.max(1, Math.floor((availableHeight + rowGap) / rowHeight));
        const nextPageSize = Math.max(1, columnCount * rows);

        setGridPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
      });
    };

    scheduleMeasure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(parent);
    observer.observe(grid);
    if (headerRef.current) observer.observe(headerRef.current);
    if (paginationRef.current) observer.observe(paginationRef.current);

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [section.items.length, showPagination, viewMode]);

  const getPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const getItemHref = (item: TMediaItem) => {
    const detailTarget = item.link ?? item.id;
    const detailPath = `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(detailTarget)}`;
    const params = new URLSearchParams();
    if (currentPath) params.set("from", currentPath);
    const detailHref = params.toString() ? `${detailPath}?${params}` : detailPath;

    const actionHref = resolveMediaItemActionHref(item);
    if (actionHref) {
      return actionHref;
    }
    return detailHref;
  };

  if (showSkeleton) {
    return viewMode === "list" ? (
      <div className="flex flex-col gap-6 p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-custom-background-90" />
          <div className="h-4 w-32 rounded bg-custom-background-90" />
        </div>
        <div className="flex flex-col gap-8 p-10">
          <section className="flex flex-col gap-3">
            <div className="h-4 w-32 rounded bg-custom-background-90" />
            <div
              className="grid w-full gap-4 rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2"
              style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`section-skeleton-header-${index}`} className="h-3 rounded bg-custom-background-80" />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div
                  key={`section-skeleton-row-${rowIndex}`}
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
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-6 p-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-custom-background-90" />
          <div className="h-4 w-32 rounded bg-custom-background-90" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 8 }).map((_, cardIndex) => (
            <div
              key={`section-skeleton-card-${cardIndex}`}
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
      </div>
    );
  }

  if (libraryItems.length === 0 && !query) {
    return (
      <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        Section not found.
      </div>
    );
  }

  if (libraryItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        No media matches your search.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 p-3">
      <div ref={headerRef} className="flex items-center gap-3">
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/media-library${viewMode === "list" ? "?view=list" : ""}`}
          className="rounded-md border border-custom-border-200 bg-custom-background-100 p-0.5 text-custom-text-300 hover:text-custom-text-100"
          aria-label="Back to media library"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
      </div>
      {viewMode === "list" ? (
        <MediaListView sections={[section]} getItemHref={getItemHref} />
      ) : (
        <div
          ref={gridRef}
          className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {section.items.map((item) => (
            <MediaCard
              key={`${section.title}-${item.id}`}
              item={item}
              href={getItemHref(item)}
              forceThumbnail
              className="!w-full"
            />
          ))}
        </div>
      )}
      {showPagination ? (
        <div
          ref={paginationRef}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-custom-border-200 pt-4 text-xs text-custom-text-300"
        >
          <div>
            Page {currentPage} of {totalPages} · {totalItems} items
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={getPageHref(currentPage - 1)}
                className="rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-custom-text-300 hover:text-custom-text-100"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-custom-text-300 opacity-50">
                Previous
              </span>
            )}
            <div className="flex items-center gap-1">
              {paginationItems.map((item) =>
                item.type === "ellipsis" ? (
                  <span key={item.key} className="px-2 py-1 text-custom-text-300">
                    ...
                  </span>
                ) : item.value === currentPage ? (
                  <span
                    key={item.key}
                    className="rounded-md border border-custom-border-200 bg-custom-background-90 px-2 py-1 text-custom-text-100"
                    aria-current="page"
                  >
                    {item.value}
                  </span>
                ) : (
                  <Link
                    key={item.key}
                    href={getPageHref(item.value ?? 1)}
                    className="rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-custom-text-300 hover:text-custom-text-100"
                  >
                    {item.value}
                  </Link>
                )
              )}
            </div>
            {currentPage < totalPages ? (
              <Link
                href={getPageHref(currentPage + 1)}
                className="rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-custom-text-300 hover:text-custom-text-100"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-custom-text-300 opacity-50">
                Next
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default MediaLibrarySectionPage;
