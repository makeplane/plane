"use client";

import Link from "next/link";
import type { TMediaItem } from "./media-items";
import { useVideoDuration } from "./use-video-duration";

type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

const MediaListRow = ({ item, getItemHref }: { item: TMediaItem; getItemHref?: (item: TMediaItem) => string }) => {
  const durationLabel = useVideoDuration(item);
  return (
    <Link
      href={getItemHref ? getItemHref(item) : `./${encodeURIComponent(item.id)}`}
      className="grid w-full items-center gap-4 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-left text-xs text-custom-text-300 hover:border-custom-border-300"
      style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
    >
      <div className="relative h-16 w-28 overflow-hidden rounded-md bg-custom-background-90">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-custom-text-300">No preview</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
      </div>
      <div className="capitalize">{item.mediaType}</div>
      <div>{item.createdAt}</div>
      <div>{durationLabel}</div>
    </Link>
  );
};

const MediaListSection = ({
  section,
  getItemHref,
}: {
  section: TMediaSection;
  getItemHref?: (item: TMediaItem) => string;
}) => (
  <section className="flex flex-col gap-3">
    <div className="text-sm font-semibold text-custom-text-100">{section.title}</div>
    <div
      className="grid w-full gap-4 rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-[11px] font-semibold text-custom-text-300"
      style={{ gridTemplateColumns: "120px minmax(200px, 2fr) 1fr 1fr 1fr" }}
    >
      <span>Media</span>
      <span>Name</span>
      <span>Type</span>
      <span>Date</span>
      <span>Duration</span>
    </div>
    <div className="flex flex-col gap-3">
      {section.items.map((item) => (
        <MediaListRow key={`${section.title}-${item.id}`} item={item} getItemHref={getItemHref} />
      ))}
    </div>
  </section>
);

export const MediaListView = ({
  sections,
  getItemHref,
}: {
  sections: TMediaSection[];
  getItemHref?: (item: TMediaItem) => string;
}) => (
  <div className="flex flex-col gap-8 p-10">
    {sections.map((section) => (
      <MediaListSection key={section.title} section={section} getItemHref={getItemHref} />
    ))}
  </div>
);
