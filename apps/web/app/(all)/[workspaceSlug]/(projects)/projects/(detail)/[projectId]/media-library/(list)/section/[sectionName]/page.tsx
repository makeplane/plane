"use client";

import type { MouseEvent } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

import { MediaCard } from "../../media-card";
import type { TMediaItem, TMediaSection } from "../../media-items";
import { groupMediaItemsByTag } from "../../media-items";
import { useMediaLibrary } from "../../media-library-context";
import { MediaListView } from "../../media-list-view";
import { useMediaLibraryPackageItems } from "../../use-media-library-package-items";

const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "svg", "thumbnail"]);

const resolveArtifactPath = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `/${path.replace(/^\/+/, "")}`;
};

const formatDateLabel = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  const date = new Date(parsed);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getPrimaryTag = (meta: Record<string, unknown>) => {
  const category = meta.category;
  if (Array.isArray(category)) {
    const first = category.find((entry) => typeof entry === "string" && entry.trim());
    if (first) return first;
  }
  if (typeof category === "string" && category.trim()) return category;
  return "Library";
};

const getSecondaryTag = (meta: Record<string, unknown>) => {
  const kind = meta.kind;
  if (typeof kind === "string" && kind.trim()) return kind;
  return "Media";
};

const resolveMediaType = (action: string, targetFormat?: string) => {
  const format = (targetFormat ?? "").toLowerCase();
  if (action === "play_hls") return { mediaType: "video" as const, format: "m3u8", label: "HLS" };
  if (action === "open_mp4") return { mediaType: "video" as const, format: "mp4", label: "Video" };
  if (action === "open_pdf") return { mediaType: "document" as const, format: "pdf", label: "PDF" };
  if (format === "m3u8") return { mediaType: "video" as const, format, label: "HLS" };
  if (format === "mp4") return { mediaType: "video" as const, format, label: "Video" };
  if (IMAGE_FORMATS.has(format)) return { mediaType: "image" as const, format, label: "Image" };
  return { mediaType: "document" as const, format: format || "document", label: "Document" };
};

type TResolvedEntry = {
  item: TMediaItem;
  action: string;
  targetPath: string | null;
  error: string | null;
  label: string;
};

export default function MediaLibrarySectionPage() {
  const { workspaceSlug, projectId, sectionName } = useParams() as {
    workspaceSlug: string;
    projectId: string;
    sectionName: string;
  };
  const { libraryVersion } = useMediaLibrary();
  const { items: packageItems, isLoading } = useMediaLibraryPackageItems(workspaceSlug, projectId, libraryVersion);
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const mediaTypeFilter = (searchParams.get("mediaType") ?? "").trim();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const decodedSection = decodeURIComponent(sectionName ?? "");

  const resolvedEntries = useMemo<TResolvedEntry[]>(() => {
    return packageItems.map((entry) => {
      const thumbnail = entry.thumbnail;
      const target = entry.target;
      const meta = (thumbnail.meta ?? {}) as Record<string, unknown>;
      const action = thumbnail.action ?? "";
      const { mediaType, format, label } = resolveMediaType(action, target?.format);

      const createdAt = formatDateLabel(thumbnail.created_at || thumbnail.updated_at || "");
      const thumbnailSrc = resolveArtifactPath(thumbnail.path ?? "");
      const targetPath = target?.path ? resolveArtifactPath(target.path) : null;

      const mediaItem: TMediaItem = {
        id: thumbnail.name,
        title: thumbnail.title || thumbnail.name,
        format,
        author: "Media Library",
        createdAt,
        views: 0,
        duration: "",
        primaryTag: getPrimaryTag(meta),
        secondaryTag: getSecondaryTag(meta),
        itemsCount: 1,
        meta,
        mediaType,
        thumbnail: thumbnailSrc,
        videoSrc: undefined,
        fileSrc: undefined,
        docs: [],
      };

      return {
        item: mediaItem,
        action,
        targetPath,
        error: entry.error,
        label,
      };
    });
  }, [packageItems]);

  const entryMap = useMemo(() => new Map(resolvedEntries.map((entry) => [entry.item.id, entry])), [resolvedEntries]);
  const allItems = useMemo(() => resolvedEntries.map((entry) => entry.item), [resolvedEntries]);

  const mediaSections = useMemo<TMediaSection[]>(() => groupMediaItemsByTag(allItems), [allItems]);

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

  const buildRoute = (action: string, targetPath: string) => {
    if (action === "play_hls") return `/player?src=${encodeURIComponent(targetPath)}&type=m3u8`;
    if (action === "open_mp4") return `/player?src=${encodeURIComponent(targetPath)}&type=mp4`;
    if (action === "open_pdf") return `/viewer?src=${encodeURIComponent(targetPath)}&type=pdf`;
    return null;
  };

  const getItemHref = (item: TMediaItem) => {
    const entry = entryMap.get(item.id);
    if (!entry || !entry.targetPath) return "#";
    return buildRoute(entry.action, entry.targetPath) ?? "#";
  };

  const getItemLabel = (item: TMediaItem) => entryMap.get(item.id)?.label ?? item.mediaType;

  const handleItemClick = (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => {
    const entry = entryMap.get(item.id);
    if (!entry) return;

    if (entry.error || !entry.targetPath) {
      event.preventDefault();
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Unable to open media",
        message: entry.error ?? "Linked media not found.",
      });
      return;
    }

    const route = buildRoute(entry.action, entry.targetPath);
    if (!route) {
      event.preventDefault();
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Unsupported action",
        message: `Action '${entry.action || "unknown"}' is not supported.`,
      });
    }
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
        <MediaListView
          sections={[section]}
          getItemHref={getItemHref}
          onItemClick={handleItemClick}
          getItemTypeLabel={getItemLabel}
        />
      ) : (
        <div className="flex flex-wrap gap-4">
          {section.items.map((item) => (
            <MediaCard
              key={`${section.title}-${item.id}`}
              item={item}
              href={getItemHref(item)}
              label={getItemLabel(item)}
              forceThumbnail
              onClick={handleItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
