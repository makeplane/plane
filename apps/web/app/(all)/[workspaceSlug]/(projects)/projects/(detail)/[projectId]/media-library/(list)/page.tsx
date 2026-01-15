"use client";

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { MediaCard } from "./media-card";
import type { TMediaItem, TMediaSection } from "./media-items";
import { groupMediaItemsByTag, resolveMediaItemActionHref } from "./media-items";
import { useMediaLibrary } from "./media-library-context";
import { buildMetaFilterConfigs, collectMetaFilterOptions } from "./media-library-filters";
import { MediaListView } from "./media-list-view";
import { useMediaLibraryItems } from "./use-media-library-items";

const MediaRow = ({ section, getItemHref }: { section: TMediaSection; getItemHref: (item: TMediaItem) => string }) => {
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
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {section.items.map((item, index) => (
          <MediaCard key={`${item.id}-${index}`} item={item} href={getItemHref(item)} className="w-full" />
        ))}
      </div>
      <hr className="border-0 border-t border-custom-border-300/60" />
    </section>
  );
};

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
  const mediaSections = useMemo(() => groupMediaItemsByTag(libraryItems), [libraryItems]);
  console.log("Media Sections:", libraryItems);
  const filterConfigs = useMemo(
    () => buildMetaFilterConfigs(collectMetaFilterOptions(libraryItems), operatorConfigs),
    [libraryItems, operatorConfigs]
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

  const showSkeleton = isLoading && libraryItems.length === 0;

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
                  <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
        ) : mediaSections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
            No media matches your search.
          </div>
        ) : viewMode === "list" ? (
          <MediaListView sections={mediaSections} getItemHref={getItemHref} />
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
