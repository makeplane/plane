"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MediaCard } from "../../media-card";
import type { TMediaItem, TMediaSection } from "../../media-items";
import { resolveMediaItemActionHref } from "../../media-items";
import { useMediaLibrary } from "../../media-library-context";
import { MediaListView } from "../../media-list-view";
import { useMediaLibraryItems } from "../../use-media-library-items";

export default function MediaLibrarySectionPage() {
  const { workspaceSlug, projectId, sectionName } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    sectionName: string;
  };
  const { libraryVersion, mediaFilters } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const pathname = usePathname();
  const pageParam = Number(searchParams.get("page") ?? "1");
  const pageSize = viewMode === "list" ? 10 : 12;
  const requestedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const decodedSection = decodeURIComponent(sectionName ?? "");
  const filterConditions = useMemo(
    () =>
      mediaFilters.allConditionsForDisplay.map(({ property, operator, value }) => ({
        property,
        operator,
        value,
      })),
    [mediaFilters.allConditionsForDisplay]
  );
  const { items: libraryItems, isLoading, pagination } = useMediaLibraryItems(
    workspaceSlug,
    projectId,
    libraryVersion,
    {
      query,
      section: decodedSection,
      filters: filterConditions,
      formats: "thumbnail",
      page: requestedPage,
      perPage: pageSize,
    }
  );

  const section = useMemo<TMediaSection>(
    () => ({
      title: decodedSection || "Upload",
      items: libraryItems,
    }),
    [decodedSection, libraryItems]
  );
  const showSkeleton = isLoading && libraryItems.length === 0;
  const totalItems = pagination?.totalResults ?? libraryItems.length;
  const totalPages = pagination?.totalPages ?? 1;
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
    if (item.link) {
      return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.link)}`;
    }
    const actionHref = resolveMediaItemActionHref(item);
    if (actionHref) {
      return actionHref;
    }
    return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;
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
    <div className="flex flex-col gap-6 p-3">
      <div className="flex items-center gap-3">
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
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-custom-border-200 pt-4 text-xs text-custom-text-300">
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
}
