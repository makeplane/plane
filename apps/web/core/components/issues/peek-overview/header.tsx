"use client";

import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Link2, MoveDiagonal, MoveRight, UploadCloud } from "lucide-react";
// plane imports
import { API_BASE_URL, WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast, updateToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueAttachment, TNameDescriptionLoader } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { AlertModalCore, CustomSelect } from "@plane/ui";
import { copyUrlToClipboard, generateWorkItemLink, getAssetIdFromUrl, getFileName, getFileURL } from "@plane/utils";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { MediaLibraryService } from "@/services/media-library.service";
// local imports
import { IssueSubscription } from "../issue-detail/subscription";
import {
  DOC_FORMATS,
  IMAGE_FORMATS,
  buildArtifactName,
  buildEventMeta,
  getErrorMessage,
  isDuplicateArtifactError,
  resolveArtifactAction,
  resolveArtifactFormat,
  resolveArtifactPathFromAssetUrl,
  resolveAttachmentDownloadUrl,
  resolveAttachmentFileName,
} from "../issue-detail-widgets/action-buttons";
import { WorkItemDetailQuickActions } from "../issue-layouts/quick-action-dropdowns";
import { NameDescriptionUpdateStatus } from "../issue-update-status";

export type TPeekModes = "side-peek" | "modal" | "full-screen";

const PEEK_OPTIONS: { key: TPeekModes; icon: any; i18n_title: string }[] = [
  {
    key: "side-peek",
    icon: SidePanelIcon,
    i18n_title: "common.side_peek",
  },
  {
    key: "modal",
    icon: CenterPanelIcon,
    i18n_title: "common.modal",
  },
  {
    key: "full-screen",
    icon: FullScreenPanelIcon,
    i18n_title: "common.full_screen",
  },
];

export type PeekOverviewHeaderProps = {
  peekMode: TPeekModes;
  setPeekMode: (value: TPeekModes) => void;
  removeRoutePeekId: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isArchived: boolean;
  disabled: boolean;
  embedIssue: boolean;
  toggleDeleteIssueModal: (value: boolean) => void;
  toggleArchiveIssueModal: (value: boolean) => void;
  toggleDuplicateIssueModal: (value: boolean) => void;
  toggleEditIssueModal: (value: boolean) => void;
  handleRestoreIssue: () => Promise<void>;
  isSubmitting: TNameDescriptionLoader;
  descriptionImageUrls?: string[];
  onInlineCleanupModalChange?: (isOpen: boolean) => void;
};

type TMediaLibraryAddResult = {
  total: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage?: string;
};

const resolveInlineAssetUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  return getFileURL(trimmed) ?? trimmed;
};

const normalizeUrlForCompare = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (typeof window === "undefined") return trimmed;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return trimmed;
  }
};

const hashInlineSource = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const normalizeInlineSourceKey = (value: string) => {
  const resolved = resolveInlineAssetUrl(value);
  if (!resolved) return "";
  const normalized = normalizeUrlForCompare(resolved);
  if (!normalized) return "";
  if (normalized.startsWith("data:")) {
    return `data:${hashInlineSource(normalized)}`;
  }
  return normalized;
};

const resolveInlineAssetId = (value: string) => {
  const resolved = resolveInlineAssetUrl(value);
  if (!resolved) return "";
  if (resolved.startsWith("data:") || resolved.startsWith("blob:")) return "";
  try {
    const parsed = new URL(resolved, window.location.origin);
    return getAssetIdFromUrl(parsed.pathname);
  } catch {
    return getAssetIdFromUrl(resolved);
  }
};

const resolveManifestMeta = (
  artifact: Record<string, unknown>,
  metadata: Record<string, Record<string, unknown>> | undefined
) => {
  const direct = artifact.meta;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct as Record<string, unknown>;
  const metadataRef = (artifact.metadata_ref as string | undefined) || (artifact.name as string | undefined);
  if (!metadataRef || !metadata || typeof metadata !== "object") return {};
  const resolved = metadata[metadataRef];
  if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) return resolved;
  return {};
};

const resolveInlineFileName = (value: string, index: number) => {
  const trimmed = value.trim();
  if (!trimmed) return `image-${index}.png`;
  if (trimmed.startsWith("data:")) {
    const match = /^data:([^;]+);/i.exec(trimmed);
    const mime = match?.[1]?.toLowerCase() ?? "";
    let extension = mime.startsWith("image/") ? mime.split("/")[1] : "png";
    if (extension === "svg+xml") extension = "svg";
    return `embedded-image-${index}.${extension}`;
  }
  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(trimmed, window.location.origin);
      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment) return decodeURIComponent(lastSegment);
    } catch {
      // ignore parse error
    }
  }
  return `image-${index}.png`;
};

const resolveInlineFileId = (value: string, index: number) => {
  const trimmed = value.trim();
  if (!trimmed) return `inline-${index}`;
  if (trimmed.startsWith("data:")) return `embedded-${index}`;
  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(trimmed, window.location.origin);
      return getAssetIdFromUrl(parsed.pathname);
    } catch {
      return getAssetIdFromUrl(trimmed);
    }
  }
  return getAssetIdFromUrl(trimmed);
};

const resolveInlineArtifactNames = (value: string, index: number) => {
  const resolved = resolveInlineAssetUrl(value);
  if (!resolved) return [];
  const rawFileName = resolveInlineFileName(resolved, index + 1);
  const fileId = resolveInlineFileId(resolved, index + 1);
  if (!fileId) return [];

  const names: string[] = [];
  if (rawFileName) {
    names.push(buildArtifactName(rawFileName, fileId));
  }
  if (rawFileName && !rawFileName.includes(".")) {
    names.push(buildArtifactName(`${fileId}.asset`, fileId));
  }
  return names.filter(Boolean);
};

const resolveFormatFromMime = (mime: string) => {
  if (!mime) return "";
  const normalized = mime.toLowerCase();
  if (normalized.startsWith("image/")) {
    const subtype = normalized.split("/")[1] ?? "";
    return subtype === "svg+xml" ? "svg" : subtype;
  }
  if (normalized.startsWith("video/")) return normalized.split("/")[1] ?? "";
  if (normalized === "application/pdf") return "pdf";
  if (normalized.includes("spreadsheet")) return "xlsx";
  if (normalized.includes("msword")) return "doc";
  return "";
};

const resolveFormatFromDisposition = (value: string) => {
  if (!value) return "";
  const filenameStarMatch = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(value);
  if (filenameStarMatch?.[1]) {
    return resolveArtifactFormat(decodeURIComponent(filenameStarMatch[1]));
  }
  const filenameMatch = /filename\s*=\s*"?([^\";]+)"?/i.exec(value);
  if (filenameMatch?.[1]) {
    return resolveArtifactFormat(decodeURIComponent(filenameMatch[1]));
  }
  return "";
};

const resolveInlineImageFormatFromAssetUrl = async (url: string) => {
  if (!url || !API_BASE_URL || !url.startsWith(API_BASE_URL)) return "";
  try {
    const signedUrl = await resolveAttachmentDownloadUrl(url);
    if (!signedUrl) return "";
    const parsed = new URL(signedUrl);
    const disposition = parsed.searchParams.get("response-content-disposition") ?? "";
    const formatFromDisposition = resolveFormatFromDisposition(disposition);
    if (formatFromDisposition) return formatFromDisposition;
    const fileName = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
    return resolveArtifactFormat(fileName);
  } catch {
    return "";
  }
};

const getApiOrigin = () => {
  if (!API_BASE_URL) return "";
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
};

const shouldIncludeCredentialsForUrl = (url: string) => {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    const apiOrigin = getApiOrigin();
    return parsed.origin === window.location.origin || (apiOrigin && parsed.origin === apiOrigin);
  } catch {
    return false;
  }
};

const appendJsonResponseParam = (url: string) => {
  if (typeof window === "undefined") return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!parsed.searchParams.get("response")) {
      parsed.searchParams.set("response", "json");
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const fetchInlineImageResponse = async (url: string) => {
  if (!url) {
    throw new Error("Unable to access inline image.");
  }
  const apiOrigin = getApiOrigin();
  const parsedUrl = typeof window !== "undefined" ? new URL(url, window.location.origin) : null;
  const isApiAssetUrl =
    parsedUrl && apiOrigin && parsedUrl.origin === apiOrigin && parsedUrl.pathname.includes("/api/assets/v2/workspaces/");

  const initialUrl = isApiAssetUrl ? appendJsonResponseParam(url) : url;
  const response = await fetch(initialUrl, {
    credentials: shouldIncludeCredentialsForUrl(initialUrl) ? "include" : "omit",
  });
  if (response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await response.json()) as { asset_url?: string; url?: string };
      const assetUrl = data.asset_url ?? data.url;
      if (!assetUrl) {
        throw new Error("Unable to access inline image.");
      }
      const assetResponse = await fetch(assetUrl, { credentials: "omit" });
      if (!assetResponse.ok) {
        throw new Error("Unable to access inline image.");
      }
      return assetResponse;
    }
    return response;
  }

  const fallbackUrl = await resolveAttachmentDownloadUrl(url);
  if (!fallbackUrl) {
    throw new Error("Unable to access inline image.");
  }
  const fallbackResponse = await fetch(fallbackUrl, { credentials: "omit" });
  if (!fallbackResponse.ok) {
    throw new Error("Unable to access inline image.");
  }
  return fallbackResponse;
};

const resolveInlineManifestCleanupArtifacts = ({
  issueId,
  candidates,
  currentDescriptionImages,
  manifestArtifacts,
  manifestMetadata,
}: {
  issueId: string;
  candidates: Array<{ url: string; index: number }>;
  currentDescriptionImages: string[];
  manifestArtifacts: Record<string, unknown>[];
  manifestMetadata?: Record<string, Record<string, unknown>>;
}) => {
  const inlineSourceKeys = new Set(candidates.map(({ url }) => normalizeInlineSourceKey(url)).filter(Boolean));
  const inlineUrlKeys = new Set(
    candidates
      .map(({ url }) => normalizeUrlForCompare(resolveInlineAssetUrl(url)))
      .filter((entry) => entry && !entry.startsWith("data:"))
  );
  const inlineAssetIds = new Set(candidates.map(({ url }) => resolveInlineAssetId(url)).filter(Boolean));
  const currentInlineSourceKeys = new Set(currentDescriptionImages.map((url) => normalizeInlineSourceKey(url)).filter(Boolean));
  const currentInlineUrlKeys = new Set(
    currentDescriptionImages
      .map((url) => normalizeUrlForCompare(resolveInlineAssetUrl(url)))
      .filter((entry) => entry && !entry.startsWith("data:"))
  );
  const currentInlineAssetIds = new Set(currentDescriptionImages.map((url) => resolveInlineAssetId(url)).filter(Boolean));
  const artifactNameCandidates = new Set<string>();
  candidates.forEach(({ url, index }) => {
    resolveInlineArtifactNames(url, index).forEach((name) => artifactNameCandidates.add(name));
  });

  const namesToDelete = new Set<string>();

  for (const artifact of manifestArtifacts) {
    if (!artifact || typeof artifact !== "object") continue;
    const artifactName = (artifact as { name?: string }).name;
    if (!artifactName) continue;
    const workItemId = (artifact as { work_item_id?: string | null }).work_item_id ?? "";
    if (workItemId && workItemId !== issueId) continue;

    const meta = resolveManifestMeta(artifact as Record<string, unknown>, manifestMetadata);
    const inlineSource = typeof meta.inline_source === "string" ? meta.inline_source : "";
    if (inlineSource) {
      if (currentInlineSourceKeys.has(inlineSource)) continue;
      if (inlineSourceKeys.has(inlineSource)) {
        namesToDelete.add(artifactName);
      }
      continue;
    }

    const rawPath = (artifact as { path?: string }).path ?? "";
    if (rawPath && typeof rawPath === "string" && rawPath.startsWith("http")) {
      const normalizedPath = normalizeUrlForCompare(rawPath);
      if (normalizedPath) {
        if (currentInlineUrlKeys.has(normalizedPath)) continue;
        if (inlineUrlKeys.has(normalizedPath)) {
          namesToDelete.add(artifactName);
          continue;
        }
      }
    }

    const lastSegment = artifactName.split("-").pop() ?? "";
    if (lastSegment) {
      if (currentInlineAssetIds.has(lastSegment)) continue;
      if (inlineAssetIds.has(lastSegment)) {
        namesToDelete.add(artifactName);
        continue;
      }
    }

    if (artifactNameCandidates.has(artifactName)) {
      namesToDelete.add(artifactName);
    }
  }

  if (namesToDelete.size === 0 && currentDescriptionImages.length === 0) {
    for (const artifact of manifestArtifacts) {
      if (!artifact || typeof artifact !== "object") continue;
      const artifactName = (artifact as { name?: string }).name;
      if (!artifactName) continue;
      const workItemId = (artifact as { work_item_id?: string | null }).work_item_id ?? "";
      if (workItemId && workItemId !== issueId) continue;
      const meta = resolveManifestMeta(artifact as Record<string, unknown>, manifestMetadata);
      const metaSource = typeof meta.source === "string" ? meta.source : "";
      if (metaSource === "work_item_description") {
        namesToDelete.add(artifactName);
      }
    }
  }

  return namesToDelete;
};

export const IssuePeekOverviewHeader: FC<PeekOverviewHeaderProps> = observer((props) => {
  const {
    peekMode,
    setPeekMode,
    workspaceSlug,
    projectId,
    issueId,
    isArchived,
    disabled,
    embedIssue = false,
    removeRoutePeekId,
    toggleDeleteIssueModal,
    toggleArchiveIssueModal,
    toggleDuplicateIssueModal,
    toggleEditIssueModal,
    handleRestoreIssue,
    isSubmitting,
    descriptionImageUrls = [],
    onInlineCleanupModalChange,
  } = props;
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
    attachment,
    fetchAttachments,
    setPeekIssue,
    removeIssue,
    archiveIssue,
    getIsIssuePeeked,
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();
  const { getProjectIdentifierById } = useProject();
  const [isAddingToMediaLibrary, setIsAddingToMediaLibrary] = useState(false);
  const [isInlineCleanupModalOpen, setIsInlineCleanupModalOpen] = useState(false);
  const [isInlineCleanupSubmitting, setIsInlineCleanupSubmitting] = useState(false);
  const [inlineCleanupCandidates, setInlineCleanupCandidates] = useState<
    Array<{
      url: string;
      index: number;
    }>
  >([]);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  // derived values
  const issueDetails = getIssueById(issueId);
  const currentMode = PEEK_OPTIONS.find((m) => m.key === peekMode);
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);
  const {
    issues: { removeIssue: removeArchivedIssue },
  } = useIssues(EIssuesStoreType.ARCHIVED);
  const createdByDetails = issueDetails?.created_by ? getUserDetails(issueDetails.created_by) : undefined;
  const createdByName = createdByDetails?.display_name?.includes("-intake")
    ? "Plane"
    : createdByDetails?.display_name ?? issueDetails?.created_by ?? "";
  const baseEventMeta = useMemo(() => buildEventMeta(issueDetails, createdByName), [issueDetails, createdByName]);
  const attachmentIds = attachment.getAttachmentsByIssueId(issueId) ?? [];
  const attachmentCount = issueDetails?.attachment_count ?? attachmentIds.length;
  const normalizedDescriptionImages = useMemo(() => {
    const uniqueImages = new Map<string, string>();
    for (const rawValue of descriptionImageUrls) {
      const resolved = resolveInlineAssetUrl(rawValue);
      if (!resolved) continue;
      const key = normalizeUrlForCompare(resolved);
      if (!uniqueImages.has(key)) uniqueImages.set(key, resolved);
    }
    return Array.from(uniqueImages.values());
  }, [descriptionImageUrls]);
  const previousDescriptionImagesRef = useRef<string[]>([]);
  const previousIssueIdRef = useRef(issueId);
  const hasMediaAssets = attachmentCount > 0 || normalizedDescriptionImages.length > 0;

  const setInlineCleanupModalOpen = useCallback(
    (next: boolean) => {
      setIsInlineCleanupModalOpen(next);
      onInlineCleanupModalChange?.(next);
    },
    [onInlineCleanupModalChange]
  );

  useEffect(() => {
    if (previousIssueIdRef.current !== issueId) {
      previousIssueIdRef.current = issueId;
      previousDescriptionImagesRef.current = normalizedDescriptionImages;
      setInlineCleanupCandidates([]);
      setInlineCleanupModalOpen(false);
      return;
    }

    const previous = previousDescriptionImagesRef.current;
    if (previous.length === 0) {
      previousDescriptionImagesRef.current = normalizedDescriptionImages;
      return;
    }

    const currentKeys = new Set(normalizedDescriptionImages.map((url) => normalizeUrlForCompare(url)));
    const removedImages = previous
      .map((url, index) => ({ url, index }))
      .filter(({ url }) => !currentKeys.has(normalizeUrlForCompare(url)));

    if (removedImages.length === 0) {
      previousDescriptionImagesRef.current = normalizedDescriptionImages;
      return;
    }

    previousDescriptionImagesRef.current = normalizedDescriptionImages;
    if (!workspaceSlug || !projectId) return;

    const candidates = removedImages;
    if (candidates.length === 0) return;
    let isMounted = true;
    const verifyAndOpenInlineCleanup = async () => {
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const manifestArtifacts = Array.isArray(manifest?.artifacts)
          ? (manifest.artifacts as unknown as Record<string, unknown>[])
          : [];
        const manifestMetadata =
          manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
            ? (manifest.metadata as Record<string, Record<string, unknown>>)
            : undefined;
        const namesToDelete = resolveInlineManifestCleanupArtifacts({
          issueId,
          candidates,
          currentDescriptionImages: normalizedDescriptionImages,
          manifestArtifacts,
          manifestMetadata,
        });
        if (!isMounted || namesToDelete.size === 0) return;
        setInlineCleanupCandidates((prev) => {
          const merged = new Map<string, { url: string; index: number }>();
          prev.forEach((entry) => merged.set(`${entry.url}::${entry.index}`, entry));
          candidates.forEach((entry) => merged.set(`${entry.url}::${entry.index}`, entry));
          return Array.from(merged.values());
        });
        setInlineCleanupModalOpen(true);
      } catch {
        // Ignore manifest lookup failures; do not prompt cleanup without verification.
      }
    };
    void verifyAndOpenInlineCleanup();

    return () => {
      isMounted = false;
    };
  }, [issueId, normalizedDescriptionImages, mediaLibraryService, projectId, workspaceSlug, setInlineCleanupModalOpen]);

  const handleInlineCleanupClose = useCallback(() => {
    setInlineCleanupModalOpen(false);
    setInlineCleanupCandidates([]);
    setIsInlineCleanupSubmitting(false);
  }, [setInlineCleanupModalOpen]);

  const handleInlineCleanupConfirm = useCallback(async () => {
    if (!workspaceSlug || !projectId) {
      handleInlineCleanupClose();
      return;
    }
    setIsInlineCleanupSubmitting(true);
    try {
      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      const packageId = typeof manifest?.id === "string" ? manifest.id : null;
      if (!packageId) {
        handleInlineCleanupClose();
        return;
      }
      const manifestArtifacts = Array.isArray(manifest?.artifacts)
        ? (manifest.artifacts as unknown as Record<string, unknown>[])
        : [];
      const manifestMetadata =
        manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
          ? (manifest.metadata as Record<string, Record<string, unknown>>)
          : undefined;
      const namesToDelete = resolveInlineManifestCleanupArtifacts({
        issueId,
        candidates: inlineCleanupCandidates,
        currentDescriptionImages: normalizedDescriptionImages,
        manifestArtifacts,
        manifestMetadata,
      });

      if (namesToDelete.size > 0) {
        await Promise.all(
          Array.from(namesToDelete).map(async (artifactName) => {
            try {
              await mediaLibraryService.deleteArtifact(workspaceSlug, projectId, packageId, artifactName);
            } catch {
              // ignore cleanup errors
            }
          })
        );
      }
    } finally {
      handleInlineCleanupClose();
    }
  }, [
    handleInlineCleanupClose,
    inlineCleanupCandidates,
    issueId,
    mediaLibraryService,
    normalizedDescriptionImages,
    projectId,
    workspaceSlug,
  ]);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issueDetails?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issueDetails?.sequence_id,
    isArchived,
  });

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(workItemLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.link_copied_to_clipboard"),
      });
    });
  };

  const handleAddAssetsToMediaLibrary = useCallback(async (): Promise<TMediaLibraryAddResult> => {
    if (!workspaceSlug || !projectId || !issueId) {
      return {
        total: 0,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errorMessage: "Missing required fields.",
      };
    }

    setIsAddingToMediaLibrary(true);
    try {
      let resolvedAttachments = attachmentIds
        .map((attachmentId) => attachment.getAttachmentById(attachmentId))
        .filter((item): item is TIssueAttachment => Boolean(item));

      if (resolvedAttachments.length === 0) {
        resolvedAttachments = await fetchAttachments(workspaceSlug, projectId, issueId);
      }

      if (resolvedAttachments.length === 0 && normalizedDescriptionImages.length === 0) {
        return {
          total: 0,
          successCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errorMessage: "No attachments or inline images found for this work item.",
        };
      }

      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      const packageId = typeof manifest?.id === "string" ? manifest.id : null;
      if (!packageId) {
        return {
          total: 0,
          successCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errorMessage: "Media library package not available.",
        };
      }

      const attachmentUrlKeys = new Set(
        resolvedAttachments
          .map((attachmentItem) => resolveInlineAssetUrl(attachmentItem?.asset_url ?? ""))
          .filter(Boolean)
          .map((url) => normalizeUrlForCompare(url))
      );
      const uniqueInlineImages = normalizedDescriptionImages.filter(
        (url) => !attachmentUrlKeys.has(normalizeUrlForCompare(url))
      );
      const result: TMediaLibraryAddResult = {
        total: resolvedAttachments.length + uniqueInlineImages.length,
        successCount: 0,
        skippedCount: 0,
        failedCount: 0,
      };

      for (const attachmentItem of resolvedAttachments) {
        const fileName = resolveAttachmentFileName(attachmentItem);
        const format = resolveArtifactFormat(fileName);
        if (!format) {
          result.skippedCount += 1;
          continue;
        }

        const assetUrl = resolveInlineAssetUrl(attachmentItem.asset_url ?? "");
        if (!assetUrl) {
          result.failedCount += 1;
          continue;
        }

        try {
          const directPath = resolveArtifactPathFromAssetUrl(assetUrl);
          const artifactName = buildArtifactName(fileName, attachmentItem.id);
          const title = getFileName(fileName) || "Attachment";
          const action = resolveArtifactAction(format);
          const meta: Record<string, unknown> = { ...baseEventMeta };

          if (DOC_FORMATS.has(format)) {
            meta.kind = "document_file";
            meta.file_size = attachmentItem.attributes?.size;
            meta.file_type = format;
          }

          if (directPath) {
            await mediaLibraryService.createArtifact(workspaceSlug, projectId, packageId, {
              name: artifactName,
              title,
              format,
              link: null,
              action,
              meta,
              work_item_id: issueId,
              path: directPath,
            });
            result.successCount += 1;
            continue;
          }

          const downloadUrl = await resolveAttachmentDownloadUrl(assetUrl);
          if (!downloadUrl) {
            throw new Error(`Unable to fetch "${fileName}".`);
          }
          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error(`Unable to fetch "${fileName}".`);
          }
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: blob.type || undefined });

          await mediaLibraryService.uploadArtifact(
            workspaceSlug,
            projectId,
            packageId,
            {
              name: artifactName,
              title,
              format,
              link: null,
              action,
              meta,
              work_item_id: issueId,
            },
            file
          );
          result.successCount += 1;
        } catch (error) {
          if (isDuplicateArtifactError(error)) {
            result.skippedCount += 1;
          } else {
            result.failedCount += 1;
          }
        }
      }

      for (const [index, rawUrl] of uniqueInlineImages.entries()) {
        const resolvedUrl = resolveInlineAssetUrl(rawUrl);
        if (!resolvedUrl) {
          result.failedCount += 1;
          continue;
        }
        let fileName = resolveInlineFileName(resolvedUrl, index + 1);
        let format = resolveArtifactFormat(fileName);

        try {
          const action = resolveArtifactAction(format);
          const meta: Record<string, unknown> = {
            ...baseEventMeta,
            source: "work_item_description",
            inline_source: normalizeInlineSourceKey(resolvedUrl) || undefined,
          };
          const directPath = resolveArtifactPathFromAssetUrl(resolvedUrl);

          if (directPath && !format) {
            format = await resolveInlineImageFormatFromAssetUrl(directPath);
          }

          if (directPath && format && IMAGE_FORMATS.has(format)) {
            if (!fileName.toLowerCase().includes(".") && format) {
              fileName = `${fileName}.${format}`;
            }
            const artifactName = buildArtifactName(fileName, resolveInlineFileId(resolvedUrl, index + 1));
            const title = getFileName(fileName) || "Inline image";
            await mediaLibraryService.createArtifact(workspaceSlug, projectId, packageId, {
              name: artifactName,
              title,
              format,
              link: null,
              action,
              meta,
              work_item_id: issueId,
              path: directPath,
            });
            result.successCount += 1;
            continue;
          }

          const response = await fetchInlineImageResponse(resolvedUrl);
          const blob = await response.blob();
          if (!format) {
            format = resolveFormatFromMime(blob.type || "");
          }
          if (!format || !IMAGE_FORMATS.has(format)) {
            result.skippedCount += 1;
            continue;
          }
          if (!fileName.toLowerCase().includes(".") && format) {
            fileName = `${fileName}.${format}`;
          }
          const artifactName = buildArtifactName(fileName, resolveInlineFileId(resolvedUrl, index + 1));
          const title = getFileName(fileName) || "Inline image";
          const file = new File([blob], fileName, { type: blob.type || undefined });

          await mediaLibraryService.uploadArtifact(
            workspaceSlug,
            projectId,
            packageId,
            {
              name: artifactName,
              title,
              format,
              link: null,
              action,
              meta,
              work_item_id: issueId,
            },
            file
          );
          result.successCount += 1;
        } catch (error) {
          if (isDuplicateArtifactError(error)) {
            result.skippedCount += 1;
          } else {
            result.failedCount += 1;
          }
        }
      }

      if (result.successCount === 0) {
        if (result.skippedCount > 0 && result.failedCount === 0) {
          return {
            ...result,
            errorMessage: "Assets already exist in the media library.",
          };
        }
        if (result.skippedCount > 0 && result.failedCount > 0) {
          return {
            ...result,
            errorMessage: "Some assets could not be added to the media library.",
          };
        }
        return {
          ...result,
          errorMessage: "Unable to add assets to the media library.",
        };
      }

      return result;
    } finally {
      setIsAddingToMediaLibrary(false);
    }
  }, [
    attachment,
    attachmentIds,
    baseEventMeta,
    fetchAttachments,
    issueId,
    mediaLibraryService,
    normalizedDescriptionImages,
    projectId,
    workspaceSlug,
  ]);

  const handleAddAssetsClick = useCallback(async () => {
    if (disabled || isAddingToMediaLibrary || !hasMediaAssets) return;
    const toastId = setToast({
      type: TOAST_TYPE.LOADING,
      title: "Adding assets to media library...",
    });
    try {
      const data = await handleAddAssetsToMediaLibrary();
      if (data?.errorMessage) {
        updateToast(toastId, {
          type: TOAST_TYPE.ERROR,
          title: "Assets not added",
          message: data.errorMessage,
        });
        return;
      }
      const { total, successCount, skippedCount, failedCount } = data;
      let message = "Assets added to the media library.";
      if (failedCount === 0 && skippedCount === 0) {
        message = `${successCount} of ${total} assets added to the media library.`;
      } else if (failedCount === 0) {
        message = `${successCount} of ${total} assets added. ${skippedCount} skipped.`;
      } else {
        message = `${successCount} of ${total} assets added. ${skippedCount} skipped, ${failedCount} failed.`;
      }
      updateToast(toastId, {
        type: TOAST_TYPE.SUCCESS,
        title: "Assets added",
        message,
      });
    } catch (error) {
      updateToast(toastId, {
        type: TOAST_TYPE.ERROR,
        title: "Assets not added",
        message: getErrorMessage(error) || "Unable to add assets to the media library.",
      });
    }
  }, [disabled, handleAddAssetsToMediaLibrary, hasMediaAssets, isAddingToMediaLibrary]);

  const handleDeleteIssue = async () => {
    try {
      const deleteIssue = issueDetails?.archived_at ? removeArchivedIssue : removeIssue;

      return deleteIssue(workspaceSlug, projectId, issueId).then(() => {
        setPeekIssue(undefined);
        captureSuccess({
          eventName: WORK_ITEM_TRACKER_EVENTS.delete,
          payload: { id: issueId },
        });
      });
    } catch (error) {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("entity.delete.failed", { entity: t("issue.label", { count: 1 }) }),
      });
      captureError({
        eventName: WORK_ITEM_TRACKER_EVENTS.delete,
        payload: { id: issueId },
        error: error as Error,
      });
    }
  };

  const handleArchiveIssue = async () => {
    try {
      await archiveIssue(workspaceSlug, projectId, issueId);
      // check and remove if issue is peeked
      if (getIsIssuePeeked(issueId)) {
        removeRoutePeekId();
      }
      captureSuccess({
        eventName: WORK_ITEM_TRACKER_EVENTS.archive,
        payload: { id: issueId },
      });
    } catch (error) {
      captureError({
        eventName: WORK_ITEM_TRACKER_EVENTS.archive,
        payload: { id: issueId },
        error: error as Error,
      });
    }
  };

  return (
    <>
      <AlertModalCore
        isOpen={isInlineCleanupModalOpen}
        handleClose={handleInlineCleanupClose}
        handleSubmit={handleInlineCleanupConfirm}
        isSubmitting={isInlineCleanupSubmitting}
        title="Remove from media library?"
        variant="danger"
        primaryButtonText={{
          default: "Remove",
          loading: "Removing",
        }}
        secondaryButtonText="Keep"
        content={
          <>
            You removed {inlineCleanupCandidates.length} inline image
            {inlineCleanupCandidates.length === 1 ? "" : "s"} from the description. Do you also want to remove from the media library?
          </>
        }
      />
      <div
        className={`relative flex items-center justify-between p-4 ${
          currentMode?.key === "full-screen" ? "border-b border-custom-border-200" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <Tooltip tooltipContent={t("common.close_peek_view")} isMobile={isMobile}>
            <button onClick={removeRoutePeekId}>
              <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          </Tooltip>

          <Tooltip tooltipContent={t("issue.open_in_full_screen")} isMobile={isMobile}>
            <Link href={workItemLink} onClick={() => removeRoutePeekId()}>
              <MoveDiagonal className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
            </Link>
          </Tooltip>
          {currentMode && embedIssue === false && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <CustomSelect
                value={currentMode}
                onChange={(val: any) => setPeekMode(val)}
                customButton={
                  <Tooltip tooltipContent={t("common.toggle_peek_view_layout")} isMobile={isMobile}>
                    <button type="button" className="">
                      <currentMode.icon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
                    </button>
                  </Tooltip>
                }
              >
                {PEEK_OPTIONS.map((mode) => (
                  <CustomSelect.Option key={mode.key} value={mode.key}>
                    <div
                      className={`flex items-center gap-1.5 ${
                        currentMode.key === mode.key
                          ? "text-custom-text-200"
                          : "text-custom-text-400 hover:text-custom-text-200"
                      }`}
                    >
                      <mode.icon className="-my-1 h-4 w-4 flex-shrink-0" />
                      {t(mode.i18n_title)}
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          )}
        </div>
        <div className="flex items-center gap-x-4">
          <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          <div className="flex items-center gap-4">
            {currentUser && !isArchived && (
              <IssueSubscription workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
            )}
            {hasMediaAssets && (
              <Tooltip tooltipContent="Add assets in media library" isMobile={isMobile}>
                <button
                  type="button"
                  onClick={handleAddAssetsClick}
                  disabled={disabled || isAddingToMediaLibrary}
                  className="disabled:cursor-not-allowed"
                >
                  <UploadCloud
                    className={`h-4 w-4 ${
                      disabled || isAddingToMediaLibrary
                        ? "text-custom-text-400"
                        : "text-custom-text-300 hover:text-custom-text-200"
                    }`}
                  />
                </button>
              </Tooltip>
            )}
            <Tooltip tooltipContent={t("common.actions.copy_link")} isMobile={isMobile}>
              <button type="button" onClick={handleCopyText}>
                <Link2 className="h-4 w-4 -rotate-45 text-custom-text-300 hover:text-custom-text-200" />
              </button>
            </Tooltip>
            {issueDetails && (
              <WorkItemDetailQuickActions
                parentRef={parentRef}
                issue={issueDetails}
                handleDelete={handleDeleteIssue}
                handleArchive={handleArchiveIssue}
                handleRestore={handleRestoreIssue}
                readOnly={disabled}
                toggleDeleteIssueModal={toggleDeleteIssueModal}
                toggleArchiveIssueModal={toggleArchiveIssueModal}
                toggleDuplicateIssueModal={toggleDuplicateIssueModal}
                toggleEditIssueModal={toggleEditIssueModal}
                isPeekMode
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
});
