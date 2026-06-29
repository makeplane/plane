"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CalendarClock,
  Clock,
  File,
  Image as ImageIcon,
  ImageOff,
  MapPin,
  Monitor,
  Tag as TagIcon,
  Video,
} from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { ETagSize, ETagVariant, Tag } from "@plane/ui";
import { parseOppositionTeam } from "@/helpers/opposition-team";

import { useVideoDuration } from "../hooks/use-video-duration";
import type { TMediaItem } from "../types/media-library.types";
import {
  formatMetaValue,
  resolveOppositionLogoUrl,
} from "../utils/media-detail-utils";
import {
  getEventMediaContextLabel,
  getEventMediaDateLabel,
  getEventMediaDetails,
  getEventMediaMetrics,
  isEventMediaItem,
} from "../utils/media-event";

const splitEventMatchup = (title: string) => {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return {
      away: "Away",
      home: "Home",
    };
  }

  const matchupParts = normalizedTitle
    .split(/\s+vs\.?\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (matchupParts.length >= 2) {
    return {
      away: matchupParts[1],
      home: matchupParts[0],
    };
  }

  return {
    away: "Away",
    home: normalizedTitle,
  };
};

const getTeamBadgeText = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "?";
  }

  if (normalizedValue.length <= 4 && !normalizedValue.includes(" ")) {
    return normalizedValue.toUpperCase();
  }

  const parts = normalizedValue.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 3).map((part) => part[0]?.toUpperCase() ?? "").join("");

  return initials || normalizedValue.slice(0, 2).toUpperCase();
};

const EventTeamBadge = ({
  fallbackLabel,
  logoSrc,
  name,
}: {
  fallbackLabel: string;
  logoSrc?: string;
  name: string;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoSrc]);

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-custom-border-200 bg-custom-background-80 shadow-sm">
        {logoSrc && !imageFailed ? (
          <img
            src={logoSrc}
            alt={name}
            className="h-10 w-10 object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-sm font-semibold tracking-[-0.03em] text-custom-text-100">
            {fallbackLabel}
          </span>
        )}
      </div>
      <div className="line-clamp-1 max-w-[84px] text-[11px] font-medium tracking-[-0.02em] text-custom-text-100">
        {name}
      </div>
    </div>
  );
};

export const MediaCard = ({
  item,
  href,
  className,
  forceThumbnail: _forceThumbnail,
  label: _label,
  onClick: _onClick,
}: {
  item: TMediaItem;
  href: string;
  className?: string;
  forceThumbnail?: boolean;
  label?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>, item: TMediaItem) => void;
}) => {
  // console.log("Rendering MediaCard for item:", item);
  const isHls = item.mediaType === "video" && item.format.toLowerCase() === "m3u8";
  const [isThumbnailUnavailable, setIsThumbnailUnavailable] = useState(!item.thumbnail);
  const isEventItem = isEventMediaItem(item);
  const eventDetails = getEventMediaDetails(item);
  const eventDateLabel = getEventMediaDateLabel(item);
  const eventMetrics = getEventMediaMetrics(item);
  const eventContextLabel = getEventMediaContextLabel(item);
  const itemDescription = item.description || eventContextLabel || "";

  useEffect(() => {
    setIsThumbnailUnavailable(!item.thumbnail);
  }, [item.thumbnail]);

  const durationLabel = useVideoDuration(item);
  const isExternal = /^https?:\/\//i.test(href);
  const showLinkedTypeIndicator = item.mediaType === "image" && Boolean(item.link) && Boolean(item.linkedMediaType);
  const isLinkedDocumentThumbnail = item.mediaType === "image" && item.linkedMediaType === "document";
  const shouldRenderEventPreview =
    isEventItem && (item.mediaType === "document" || isLinkedDocumentThumbnail || !item.thumbnail);
  const linkedTypeLabel = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? "Video"
      : item.linkedMediaType === "image"
        ? "Image"
        : "Document"
    : "";
  const shouldUseCredentials = (src: string) => {
    if (!src) return false;
    if (src.startsWith("/")) return true;
    if (!/^https?:\/\//i.test(src)) return true;
    try {
      const url = new URL(src);
      if (typeof window !== "undefined" && url.origin === window.location.origin) return true;
      if (API_BASE_URL) {
        try {
          return url.origin === new URL(API_BASE_URL).origin;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
    return false;
  };
  const useCredentials = shouldUseCredentials(item.videoSrc ?? "");
  const crossOrigin = useCredentials ? "use-credentials" : "anonymous";
  const LinkedTypeIcon = showLinkedTypeIndicator
    ? item.linkedMediaType === "video"
      ? Video
      : item.linkedMediaType === "image"
        ? ImageIcon
        : File
    : null;
  const eventPreviewContext =
    [eventDetails?.program, eventDetails?.level].filter((entry): entry is string => Boolean(entry)).join(" · ") ||
    eventContextLabel ||
    "Completed event package";
  const eventPreviewTitle = eventDetails?.title || item.title;
  const eventPreviewMeta = [eventDetails?.sport, eventDetails?.program, eventDetails?.level]
    .filter((entry): entry is string => Boolean(entry))
    .join(" · ");
  const eventPreviewSubMeta = [eventDetails?.program, eventDetails?.level]
    .filter((entry): entry is string => Boolean(entry))
    .join(" • ");
  const eventStatusLabel = (eventDetails?.status || item.secondaryTag || "Event").trim();
  const oppositionTeam = parseOppositionTeam(item.meta?.opposition);
  const matchupTeams = splitEventMatchup(eventPreviewTitle);
  const homeTeamName = matchupTeams.home;
  const awayTeamName = oppositionTeam?.name || matchupTeams.away;
  const awayTeamLogo = resolveOppositionLogoUrl(oppositionTeam?.logo);
  const eventTagCount = eventDetails?.tagCount ?? 0;
  const eventDeviceCount = eventDetails?.deviceCount ?? 0;
  const eventLocationLabel = eventDetails?.locationLabel || "";
  const eventBroadcastLabel = eventDetails?.primaryStreamName || eventDetails?.primaryStreamId || "";
  const eventSecondaryPill = eventDetails?.level || item.secondaryTag;
  const shouldRenderEventCard = isEventItem;

  const thumbnailUnavailableFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-custom-text-300">
      {isEventItem ? (
        <CalendarClock className="h-16 w-16" strokeWidth={2.5} />
      ) : (
        <ImageOff className="h-16 w-16" strokeWidth={2.5} />
      )}
      <span className="sr-only">Thumbnail unavailable</span>
    </div>
  );

  const eventPreview = (
    <div className="relative h-full w-full overflow-hidden bg-[#0B1220]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(10,15,29,0.96),rgba(15,23,42,0.82),rgba(10,15,29,0.98))]" />
      <div className="absolute -right-8 top-3 h-24 w-24 rounded-full border border-white/10" />
      <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full border border-white/5" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur">
              Event
            </span>
            {eventDetails?.status ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/65 backdrop-blur">
                {eventDetails.status}
              </span>
            ) : null}
          </div>
          {eventPreviewMeta ? <div className="line-clamp-1 text-[11px] text-white/62">{eventPreviewMeta}</div> : null}
        </div>

        <div className="flex flex-1 items-center py-3">
          <div className="space-y-2">
            <div className="line-clamp-2 text-[24px] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
              {eventPreviewTitle}
            </div>
            {eventPreviewContext ? (
              <div className="line-clamp-2 text-[12px] font-medium text-white/72">{eventPreviewContext}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <div className="line-clamp-1 text-[11px] text-white/60">{eventDateLabel || item.createdAt}</div>
        </div>
      </div>
    </div>
  );

  const eventCardBody = (
    <div
      className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
        className ?? ""
      }`.trim()}
    >
      <div className="overflow-hidden rounded-lg  bg-custom-background-100 shadow-sm transition-colors hover:border-custom-border-300">
        <div className="relative h-[170px] overflow-hidden bg-[linear-gradient(180deg,#0B1220_0%,#121C33_100%)]">
          {!isThumbnailUnavailable && item.thumbnail ? (
            <img
              src=''
              alt=''
              onError={() => setIsThumbnailUnavailable(true)}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-[2px]"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(59,130,246,0.22),transparent_38%),linear-gradient(180deg,rgba(8,13,24,0.14),rgba(8,13,24,0.55))]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-custom-background-100 via-custom-background-100/88 to-transparent" />
          <div className="absolute left-3 top-3 z-[1]">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#274A7B] bg-[#11284A] px-2 py-1 text-[10px] font-medium text-[#7AB7FF] shadow-sm">
              <Calendar className="h-3 w-3" strokeWidth={2.2} />
              Event
            </span>
          </div>
          <div className="absolute inset-x-0 top-0 flex h-full items-center justify-between px-4 pt-12">
            <EventTeamBadge
              fallbackLabel={getTeamBadgeText(homeTeamName)}
              name={homeTeamName}
            />
            <div className="pointer-events-none absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 text-[20px] font-semibold tracking-[-0.08em] text-white/8">
              VS
            </div>
            <EventTeamBadge
              fallbackLabel={getTeamBadgeText(awayTeamName)}
              logoSrc={awayTeamLogo || undefined}
              name={awayTeamName}
            />
          </div>
        </div>

        <div className=" bg-custom-background-100 px-4 py-3">
          {eventPreviewMeta ? (
            <div className="line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-custom-text-300">
              {eventPreviewMeta.replace(/ · /g, " • ")}
            </div>
          ) : null}

          <div className="mt-2 line-clamp-2 text-[15px] font-semibold tracking-[-0.04em] text-custom-text-100">
            {eventPreviewTitle}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-custom-text-300">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" strokeWidth={2.2} />
              {eventDateLabel || item.createdAt}
            </span>
            {eventTagCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                {eventTagCount} tag{eventTagCount === 1 ? "" : "s"}
              </span>
            ) : null}
            {eventDeviceCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" strokeWidth={2.2} />
                {eventDeviceCount} device{eventDeviceCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );

  const cardBody = (
    <div
      className={`group w-[220px] flex-shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] ${
        className ?? ""
      }`.trim()}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-custom-background-90">
        {showLinkedTypeIndicator && LinkedTypeIcon && !shouldRenderEventPreview ? (
          <span className="absolute right-2 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-custom-background-100/80 text-custom-text-200 backdrop-blur">
            <span className="sr-only">{linkedTypeLabel}</span>
            <LinkedTypeIcon className="h-4 w-4" strokeWidth={3.5} />
          </span>
        ) : null}
        {shouldRenderEventPreview ? (
          eventPreview
        ) : item.mediaType === "image" ? (
          isThumbnailUnavailable ? (
            thumbnailUnavailableFallback
          ) : (
            <Image
              src={item.thumbnail}
              alt={item.title}
              width={100}
              height={100}
              loading="lazy"
              onError={() => setIsThumbnailUnavailable(true)}
              className={`h-full w-full transition-transform duration-300 ${
                isLinkedDocumentThumbnail ? "object-contain p-6" : "object-cover"
              }`}
            />
          )
        ) : item.mediaType === "video" ? (
          isHls ? (
            isThumbnailUnavailable ? (
              thumbnailUnavailableFallback
            ) : (
              <Image
                src={item.thumbnail}
                alt={item.title}
                width={100}
                height={100}
                loading="lazy"
                onError={() => setIsThumbnailUnavailable(true)}
                className="h-full w-full object-cover transition-transform duration-300 "
              />
            )
          ) : (
            <video
              src={item.videoSrc ?? ""}
              poster={item.thumbnail}
              muted
              loop
              playsInline
              preload="metadata"
              crossOrigin={crossOrigin}
              className="h-full w-full object-cover transition-transform duration-300 "
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-custom-text-300">
            <File className="h-6 w-6" strokeWidth={3.5} />
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="line-clamp-1 text-sm font-semibold text-custom-text-100">{item.title}</div>
        </div>
        {itemDescription ? (
          <div className="line-clamp-2 text-[11px] text-custom-text-300">{itemDescription}</div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-custom-text-300">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-custom-text-300" />
            {isEventItem ? eventDateLabel || item.createdAt : item.createdAt}
          </span>
          {item.mediaType === "video" && !isEventItem ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-custom-text-300" />
              {durationLabel}
            </span>
          ) : null}
          {isEventItem ? (
            eventMetrics.map((metric) => <span key={metric}>{metric}</span>)
          ) : (
            <span>Views {item.views}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Tag
            variant={ETagVariant.OUTLINED}
            size={ETagSize.SM}
            className="min-h-0 rounded-full border-0 bg-custom-primary-100/20 px-2 py-1 text-[11px] font-medium text-custom-primary-100 cursor-default hover:text-custom-primary-100"
          >
            {item.primaryTag}
          </Tag>
          {isEventItem && eventDetails?.status ? (
            <span className="rounded-full border border-custom-border-200 bg-custom-background-100 px-2 py-1 text-[11px] font-medium text-custom-text-300">
              {eventDetails.status}
            </span>
          ) : null}
          {/* <span className="inline-flex items-center gap-1 rounded-full bg-custom-background-90 px-2 py-0.5 text-custom-text-300">
            <MediaTypeIcon className="h-3 w-3" strokeWidth={3.5} />
            {mediaTypeLabel}
          </span> */}
          {/* <span className="rounded-full border border-custom-border-200 px-2 py-0.5 text-custom-text-300">
            {item.itemsCount}
          </span> */}
        </div>
      </div>
    </div>
  );

  return isExternal ? (
    <a href={href} className="text-left">
      {shouldRenderEventCard ? eventCardBody : cardBody}
    </a>
  ) : (
    <Link href={href} className="text-left">
      {shouldRenderEventCard ? eventCardBody : cardBody}
    </Link>
  );
};
