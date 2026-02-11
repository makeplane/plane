import { API_BASE_URL } from "@plane/constants";

import type { TMediaArtifact } from "@/services/media-library.service";
import {
  HLS_MIME_TYPES,
  IMAGE_ARTIFACT_ACTIONS,
  IMAGE_ARTIFACT_FORMATS,
  VIDEO_ARTIFACT_ACTIONS,
  VIDEO_ARTIFACT_FORMATS,
} from "./webhook-artifacts-constants";
import type { TWebhookArtifactMediaType, TVideoSourceCandidate } from "./webhook-artifacts-types";

export const inferFormatFromPath = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  const withoutQuery = normalized.split("?")[0].split("#")[0];
  const fileName = withoutQuery.split("/").pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";
  return fileName.slice(dotIndex + 1);
};

export const resolveWebhookArtifactType = (
  format: string,
  action: string,
  path: string,
  openUrl: string
): TWebhookArtifactMediaType => {
  const normalizedFormat = format.toLowerCase().trim();
  const normalizedAction = action.toLowerCase().trim();
  const inferredFormat = inferFormatFromPath(path) || inferFormatFromPath(openUrl);

  if (
    VIDEO_ARTIFACT_FORMATS.has(normalizedFormat) ||
    VIDEO_ARTIFACT_ACTIONS.has(normalizedAction) ||
    inferredFormat === "m3u8" ||
    openUrl.toLowerCase().includes(".m3u8")
  ) {
    return "video";
  }

  if (
    IMAGE_ARTIFACT_FORMATS.has(normalizedFormat) ||
    IMAGE_ARTIFACT_ACTIONS.has(normalizedAction) ||
    IMAGE_ARTIFACT_FORMATS.has(inferredFormat)
  ) {
    return "image";
  }

  return "document";
};

export const getVideoMimeType = (format: string) => {
  const normalized = format.toLowerCase();
  if (normalized === "mp4" || normalized === "m4v") return "video/mp4";
  if (normalized === "m3u8" || normalized === "stream") return "application/x-mpegURL";
  if (normalized === "mov") return "video/quicktime";
  if (normalized === "webm") return "video/webm";
  if (normalized === "avi") return "video/x-msvideo";
  if (normalized === "mkv") return "video/x-matroska";
  if (normalized === "mpeg" || normalized === "mpg") return "video/mpeg";
  return "";
};

export const getCredentialModeForSource = (source: string) => {
  if (typeof window === "undefined") {
    return {
      withCredentials: true,
      crossOrigin: "use-credentials" as const,
    };
  }

  if (!source || source.startsWith("/")) {
    return {
      withCredentials: true,
      crossOrigin: "use-credentials" as const,
    };
  }

  try {
    const parsed = new URL(source, window.location.origin);
    const isSameOrigin = parsed.origin === window.location.origin;
    return {
      withCredentials: isSameOrigin,
      crossOrigin: isSameOrigin ? ("use-credentials" as const) : ("anonymous" as const),
    };
  } catch {
    return {
      withCredentials: true,
      crossOrigin: "use-credentials" as const,
    };
  }
};

export const shouldUseCredentialsForSource = (source: string) => {
  if (typeof window === "undefined") return true;
  if (!source || source.startsWith("/")) return true;
  if (!/^https?:\/\//i.test(source)) return true;

  const credentialOrigins = new Set<string>([window.location.origin]);
  if (API_BASE_URL) {
    try {
      credentialOrigins.add(new URL(API_BASE_URL).origin);
    } catch {
      // ignore invalid API base URL
    }
  }

  try {
    const parsed = new URL(source, window.location.origin);
    return credentialOrigins.has(parsed.origin);
  } catch {
    return true;
  }
};

const dedupeSourceCandidates = (candidates: TVideoSourceCandidate[]) => {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.src}|${candidate.type ?? ""}|${candidate.withCredentials ? "1" : "0"}|${candidate.crossOrigin}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildSourceCandidates = (rawSource: string, isHlsStream: boolean, format: string): TVideoSourceCandidate[] => {
  const trimmed = rawSource.trim();
  if (!trimmed) return [];

  let directSource = trimmed;
  let proxiedSource = "";
  let isMixedContentBlocked = false;

  if (typeof window !== "undefined" && !trimmed.startsWith("/")) {
    try {
      const parsed = new URL(trimmed, window.location.origin);
      const absolute = parsed.toString();
      const isCrossOrigin = parsed.origin !== window.location.origin;
      isMixedContentBlocked = window.location.protocol === "https:" && parsed.protocol === "http:";

      directSource = absolute;
      if (isHlsStream && isCrossOrigin) {
        proxiedSource = `/api/hls?url=${encodeURIComponent(absolute)}`;
        if (isMixedContentBlocked) {
          directSource = "";
        }
      }
    } catch {
      directSource = trimmed;
      proxiedSource = "";
    }
  }

  const candidates: TVideoSourceCandidate[] = [];
  const appendSource = (source: string, type?: string) => {
    if (!source) return;
    const { withCredentials, crossOrigin } = getCredentialModeForSource(source);
    candidates.push({
      src: source,
      type,
      withCredentials,
      crossOrigin,
    });
  };

  if (isHlsStream) {
    if (!isMixedContentBlocked && directSource) {
      HLS_MIME_TYPES.forEach((type) => appendSource(directSource, type));
    }
    if (proxiedSource) {
      HLS_MIME_TYPES.forEach((type) => appendSource(proxiedSource, type));
    }
    if (isMixedContentBlocked && directSource) {
      HLS_MIME_TYPES.forEach((type) => appendSource(directSource, type));
    }
  } else {
    const type = getVideoMimeType(format) || undefined;
    appendSource(directSource, type);
  }

  return dedupeSourceCandidates(candidates);
};

export const resolveManifestMeta = (
  artifact: TMediaArtifact,
  metadata: Record<string, Record<string, unknown>> | undefined
): Record<string, unknown> => {
  const direct = artifact.meta;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const metadataRef = artifact.metadata_ref || artifact.name;
  if (!metadataRef || !metadata || typeof metadata !== "object") return {};
  const resolved = metadata[metadataRef];
  if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
    return resolved;
  }
  return {};
};

export const toTimestamp = (value: string | undefined) => {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
};

export const resolveOpenUrl = (
  path: string,
  workspaceSlug: string,
  projectId: string,
  packageId: string,
  artifactId: string
) => {
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const endpoint = `/api/workspaces/${workspaceSlug}/projects/${projectId}/media-library/packages/${packageId}/artifacts/${encodeURIComponent(
    artifactId
  )}/file/`;

  if (typeof window === "undefined") return endpoint;

  try {
    return new URL(endpoint, window.location.origin).toString();
  } catch {
    return endpoint;
  }
};
