import { API_BASE_URL } from "@plane/constants";
import type { IRosterPlayer } from "@plane/types";
import type { TMediaArtifact } from "@/services/media-library.service";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import type { SgTagRow } from "./types";
import { joinApiPath } from "./page-url";

type TThumbnailLookupContext = {
  packageId?: string;
  projectId: string;
  workspaceSlug: string;
};

const buildManifestArtifactFileUrl = (context: TThumbnailLookupContext, artifactName: string) => {
  const normalizedArtifactName = artifactName.trim();

  if (!context.workspaceSlug || !context.projectId || !context.packageId || !normalizedArtifactName) {
    return "";
  }

  return joinApiPath(
    API_BASE_URL,
    `/api/workspaces/${context.workspaceSlug}/projects/${context.projectId}/media-library/packages/${context.packageId}/artifacts/${encodeURIComponent(
      normalizedArtifactName
    )}/file/`
  );
};

const resolveFallbackUrl = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";
  if (/^https?:\/\//i.test(normalizedValue)) return normalizedValue;
  return `/${normalizedValue.replace(/^\/+/, "")}`;
};

const getJerseyNumberKeys = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim().replace(/^#/, "").replace(/\s+/g, "");
  if (!normalizedValue) return [];

  const withoutLeadingZeros = normalizedValue.replace(/^0+(?=\d)/, "");
  return Array.from(new Set([normalizedValue.toLowerCase(), withoutLeadingZeros.toLowerCase()].filter(Boolean)));
};

export const buildTimelinePlayerLabelMap = (players: IRosterPlayer[] | undefined) => {
  const labelMap = new Map<string, string>();

  (players ?? []).forEach((player) => {
    const playerName = player.player_name.trim();
    const jerseyNumber = player.jersey_number?.trim() ?? "";
    const playerLabel = [playerName, jerseyNumber ? `#${jerseyNumber.replace(/^#/, "")}` : ""]
      .filter(Boolean)
      .join(", ");

    if (!playerLabel) return;

    getJerseyNumberKeys(jerseyNumber).forEach((key) => {
      labelMap.set(key, playerLabel);
    });
  });

  return labelMap;
};

const getThumbnailLookupKeys = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return [];

  const keys = new Set<string>();
  const addLookupKeyVariants = (candidateValue: string) => {
    const normalizedCandidateValue = candidateValue.trim().toLowerCase();
    if (!normalizedCandidateValue) return;

    keys.add(normalizedCandidateValue);

    if (normalizedCandidateValue.startsWith("/")) {
      keys.add(normalizedCandidateValue.replace(/^\/+/, ""));
    } else if (!/^https?:\/\//i.test(normalizedCandidateValue)) {
      keys.add(`/${normalizedCandidateValue}`);
    }

    const fileName = normalizedCandidateValue.split("/").pop() ?? "";
    if (!fileName || fileName === normalizedCandidateValue) return;

    keys.add(fileName);

    const fileStem = fileName.replace(/\.[a-z0-9]+$/i, "");
    if (fileStem && fileStem !== fileName) {
      keys.add(fileStem);
    }
  };

  const baseValue = normalizedValue.split("?")[0].split("#")[0];
  addLookupKeyVariants(baseValue);

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    url.hash = "";
    url.search = "";
    addLookupKeyVariants(`${url.origin}${url.pathname}`);
    addLookupKeyVariants(url.pathname);
  } catch {
    // Keep the normalized raw value when URL parsing is unavailable for this input.
  }

  return Array.from(keys).filter(Boolean);
};

const getArtifactIdFromPath = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const match = url.pathname.match(/(?:^|\/)artifacts\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    const match = normalizedValue.match(/(?:^|\/)artifacts\/([^/]+)(?:\/|$)/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }
};

const getCoachProxyThumbnailName = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) return "";

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const normalizedPath = url.pathname.replace(/\/$/, "");
    if (!normalizedPath.endsWith("/api/coach/media/proxy")) return "";

    return (url.searchParams.get("thumbnail") ?? "").trim().replace(/\.jpg$/i, "");
  } catch {
    return "";
  }
};

const resolveCoachTagThumbnailUrl = (value: string | null | undefined, cpServerBaseUrl: string) => {
  const normalizedValue = (value ?? "").trim();
  const normalizedCpServerBaseUrl = cpServerBaseUrl.replace(/\/$/, "");
  if (!normalizedValue || !normalizedCpServerBaseUrl) return "";

  const thumbnailName = getCoachProxyThumbnailName(normalizedValue);
  if (thumbnailName) {
    return `${normalizedCpServerBaseUrl}/blobs/thumbnails/${encodeURIComponent(thumbnailName)}.jpg`;
  }

  try {
    const url = new URL(normalizedValue, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (/^https?:\/\//i.test(normalizedValue)) {
      return "";
    }
    if (url.pathname.startsWith("/blobs/thumbnails/")) {
      return `${normalizedCpServerBaseUrl}${url.pathname}${url.search}`;
    }
  } catch {
    if (normalizedValue.startsWith("/blobs/thumbnails/")) {
      return `${normalizedCpServerBaseUrl}${normalizedValue}`;
    }
  }

  if (!normalizedValue.includes("/") && !normalizedValue.includes("?") && !normalizedValue.includes("#")) {
    const thumbnailName = normalizedValue.replace(/\.jpg$/i, "");
    return `${normalizedCpServerBaseUrl}/blobs/thumbnails/${encodeURIComponent(thumbnailName)}.jpg`;
  }

  return "";
};

const isManifestThumbnailArtifact = (artifact: TMediaArtifact) =>
  (artifact.format ?? "").toLowerCase() === "thumbnail" || (artifact.action ?? "").toLowerCase() === "preview";

export const buildMediaThumbnailLookup = (
  items: TMediaItem[] | undefined,
  manifestArtifacts: TMediaArtifact[] | undefined,
  context: TThumbnailLookupContext
) => {
  const lookup = new Map<string, string>();
  const addLookup = (value: string | null | undefined, thumbnail: string) => {
    getThumbnailLookupKeys(value).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, thumbnail);
    });
  };
  const artifactByKey = new Map<string, TMediaArtifact>();
  const addArtifactLookupKeys = (artifact: TMediaArtifact, thumbnail: string) => {
    addLookup(artifact.name, thumbnail);
    addLookup(artifact.path, thumbnail);
    addLookup(artifact.link, thumbnail);

    const artifactIdFromPath = getArtifactIdFromPath(artifact.path);
    addLookup(artifactIdFromPath, thumbnail);
  };
  const resolveArtifactByValue = (value: string | null | undefined) => {
    for (const key of getThumbnailLookupKeys(value)) {
      const artifact = artifactByKey.get(key);
      if (artifact) return artifact;
    }

    return undefined;
  };

  (manifestArtifacts ?? []).forEach((artifact) => {
    getThumbnailLookupKeys(artifact.name).forEach((key) => artifactByKey.set(key, artifact));
    getThumbnailLookupKeys(artifact.path).forEach((key) => {
      if (!artifactByKey.has(key)) artifactByKey.set(key, artifact);
    });
  });

  (manifestArtifacts ?? []).forEach((artifact) => {
    if (!isManifestThumbnailArtifact(artifact)) return;

    const thumbnailUrl = buildManifestArtifactFileUrl(context, artifact.name) || resolveFallbackUrl(artifact.path);
    if (!thumbnailUrl) return;

    addArtifactLookupKeys(artifact, thumbnailUrl);

    const linkedArtifact = resolveArtifactByValue(artifact.link);
    if (linkedArtifact) {
      addArtifactLookupKeys(linkedArtifact, thumbnailUrl);
    }
  });

  (items ?? []).forEach((item) => {
    if (!item.thumbnail) return;

    addLookup(item.id, item.thumbnail);
    addLookup(item.link, item.thumbnail);
    addLookup(item.videoSrc, item.thumbnail);
    addLookup(item.imageSrc, item.thumbnail);
    addLookup(item.fileSrc, item.thumbnail);
    addLookup(item.downloadSrc, item.thumbnail);
    addLookup(item.thumbnail, item.thumbnail);
  });

  return lookup;
};

const getThumbnailFromLookup = (value: string | null | undefined, thumbnailLookup: Map<string, string>) => {
  for (const key of getThumbnailLookupKeys(value)) {
    const thumbnail = thumbnailLookup.get(key);
    if (thumbnail) return thumbnail;
  }

  return "";
};

export const resolveTagRowArtifactThumbnail = (
  row: SgTagRow,
  thumbnailLookup: Map<string, string>,
  cpServerBaseUrl: string
) => {
  if (row.thumbnailUrl) {
    const thumbnailMatch = getThumbnailFromLookup(row.thumbnailUrl, thumbnailLookup);
    if (thumbnailMatch) return thumbnailMatch;

    const thumbnailArtifactId = getArtifactIdFromPath(row.thumbnailUrl);
    if (thumbnailArtifactId) {
      const thumbnailArtifactMatch = getThumbnailFromLookup(thumbnailArtifactId, thumbnailLookup);
      if (thumbnailArtifactMatch) return thumbnailArtifactMatch;
    }

    const coachTagThumbnailUrl = resolveCoachTagThumbnailUrl(row.thumbnailUrl, cpServerBaseUrl);
    if (coachTagThumbnailUrl) return coachTagThumbnailUrl;

    return row.thumbnailUrl;
  }

  const sourceMatch = getThumbnailFromLookup(row.sourceUrl, thumbnailLookup);
  if (sourceMatch) return sourceMatch;

  const artifactId = getArtifactIdFromPath(row.sourceUrl);
  if (artifactId) {
    const artifactMatch = getThumbnailFromLookup(artifactId, thumbnailLookup);
    if (artifactMatch) return artifactMatch;
  }

  return "";
};
