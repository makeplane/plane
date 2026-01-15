"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion, {
    query,
    section: decodedSection,
    filters: filterConditions,
    formats: "thumbnail",
  });

  const section = useMemo<TMediaSection>(
    () => ({
      title: decodedSection || "Upload",
      items: libraryItems,
    }),
    [decodedSection, libraryItems]
  );
  const showSkeleton = isLoading && libraryItems.length === 0;

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
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {section.items.map((item) => (
            <MediaCard
              key={`${section.title}-${item.id}`}
              item={item}
              href={getItemHref(item)}
              forceThumbnail
              className="w-full sm:w-full md:w-full lg:w-full xl:w-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}
