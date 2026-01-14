"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MediaCard } from "../../media-card";
import type { TMediaItem, TMediaSection } from "../../media-items";
import { groupMediaItemsByTag, resolveMediaItemActionHref } from "../../media-items";
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
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const decodedSection = decodeURIComponent(sectionName ?? "");
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId, libraryVersion, {
    query,
    section: decodedSection,
  });

  const section = useMemo<TMediaSection>(
    () => ({
      title: decodedSection || "Upload",
      items: libraryItems,
    }),
    [decodedSection, libraryItems]
  );

  // const getItemHref = (item: TMediaItem) => {
  //   if (item.link) {
  //     return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.link)}`;
  //   }
  //   if ((item.action === "download" || item.action === "view") && item.fileSrc) {
  //     return item.fileSrc;
  //   }
  //   return `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;
  // };

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
        <div className="flex flex-wrap gap-4">
          {section.items.map((item) => (
            <MediaCard key={`${section.title}-${item.id}`} item={item} href={getItemHref(item)} forceThumbnail />
          ))}
        </div>
      )}
    </div>
  );
}
