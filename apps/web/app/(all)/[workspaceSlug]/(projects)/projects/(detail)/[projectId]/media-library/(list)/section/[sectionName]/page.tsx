"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { TMediaItem } from "../../media-items";
import { MEDIA_ITEMS } from "../../media-items";
import { MediaCard } from "../../media-card";
import { MediaListView } from "../../media-list-view";
import { useMediaLibrary } from "../../media-library-context";

type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

const getItemHref = (workspaceSlug: string, projectId: string, item: TMediaItem) =>
  `/${workspaceSlug}/projects/${projectId}/media-library/${encodeURIComponent(item.id)}`;

export default function MediaLibrarySectionPage() {
  const { workspaceSlug, projectId, sectionName } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    sectionName: string;
  };
  const { uploadedItems } = useMediaLibrary();
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const decodedSection = decodeURIComponent(sectionName ?? "");

  const uploadedSection = useMemo(
    () => (uploadedItems.length > 0 ? [{ title: "Uploads", items: uploadedItems }] : []),
    [uploadedItems]
  );
  const mediaSections = useMemo<TMediaSection[]>(
    () => [
      ...uploadedSection,
      { title: "Game", items: MEDIA_ITEMS.slice(0, 6) },
      { title: "Practices", items: MEDIA_ITEMS.slice(3, 9) },
      { title: "Latest", items: MEDIA_ITEMS.slice(1, 7) },
    ],
    [uploadedSection]
  );

  const section = useMemo(() => {
    const target = mediaSections.find((entry) => entry.title === decodedSection);
    if (!target) return null;
    if (!query) return target;
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
        return haystack.includes(query);
      }),
    };
  }, [decodedSection, mediaSections, query]);

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
        <MediaListView sections={[section]} getItemHref={(item) => getItemHref(workspaceSlug, projectId, item)} />
      ) : (
        <div className="flex flex-wrap gap-4">
          {section.items.map((item) => (
            <MediaCard
              key={`${section.title}-${item.id}`}
              item={item}
              href={getItemHref(workspaceSlug, projectId, item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
