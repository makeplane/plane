"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MediaCard } from "../../media-card";
import type { TMediaItem, TMediaSection } from "../../media-items";
import { groupMediaItemsByTag } from "../../media-items";
import { useMediaLibrary } from "../../media-library-context";
import { MediaListView } from "../../media-list-view";
import { useMediaLibraryItems } from "../../use-media-library-items";

export default function MediaLibrarySectionPage() {
  const { workspaceSlug, projectId, sectionName } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    sectionName: string;
  };
  const { libraryVersion } = useMediaLibrary();
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion);
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const mediaTypeFilter = (searchParams.get("mediaType") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const decodedSection = decodeURIComponent(sectionName ?? "");

  const mediaSections = useMemo<TMediaSection[]>(() => groupMediaItemsByTag(libraryItems), [libraryItems]);

  const section = useMemo(() => {
    const target = mediaSections.find((entry) => entry.title === decodedSection);
    if (!target) return null;
    if (!query && !mediaTypeFilter) return target;
    return {
      ...target,
      items: target.items.filter((item) => {
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
        const matchesType =
          !mediaTypeFilter ||
          (mediaTypeFilter === "hls" ? item.format.toLowerCase() === "m3u8" : item.mediaType === mediaTypeFilter);
        return matchesQuery && matchesType;
      }),
    };
  }, [decodedSection, mediaSections, mediaTypeFilter, query]);

  const getItemHref = (item: TMediaItem) =>
    `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;

  if (!section && isLoading) {
    return viewMode === "list" ? (
      <div className="flex flex-col gap-8 p-10 animate-pulse">
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
    ) : (
      <div className="flex flex-col gap-6 p-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-custom-background-90" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, cardIndex) => (
            <div
              key={`section-skeleton-card-${cardIndex}`}
              className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-3"
            >
              <div className="aspect-[16/9] w-full rounded bg-custom-background-90" />
              <div className="mt-3 h-4 w-3/4 rounded bg-custom-background-90" />
              <div className="mt-2 h-3 w-1/2 rounded bg-custom-background-90" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        Section not found.
      </div>
    );
  }

  if (section.items.length === 0) {
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
          href={`/${workspaceSlug}/projects/${projectId}/media-library`}
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
        <div className="flex flex-wrap gap-4">
          {section.items.map((item) => (
            <MediaCard
              key={`${section.title}-${item.id}`}
              item={item}
              href={getItemHref(item)}
              forceThumbnail
            />
          ))}
        </div>
      )}
    </div>
  );
}
