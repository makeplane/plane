"use-client";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { History } from "lucide-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TFileEntityInfo, TIssue, TNameDescriptionLoader } from "@plane/types";
import { EFileAssetType } from "@plane/types";
// components
import { calculateTimeAgo, getTextContent } from "@plane/utils";
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { IssueDescriptionInput } from "@/components/issues/description-input";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueParentDetail } from "@/components/issues/issue-detail/parent";
import { IssueReaction } from "@/components/issues/issue-detail/reactions";
import { IssueTitleInput } from "@/components/issues/title-input";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe/duplicate-popover";
import { IssueTypeSwitcher } from "@/plane-web/components/issues/issue-details/issue-type-switcher";
// plane web hooks
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { WorkItemVersionService } from "@/services/issue";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaItem } from "../../types";
// services init
const workItemVersionService = new WorkItemVersionService();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidImageSource = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  return UUID_PATTERN.test(trimmed);
};

const sanitizeMediaDescriptionHtml = (value: string) => {
  if (!value || typeof window === "undefined") return value;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    let changed = false;
    doc.querySelectorAll("image-component, img").forEach((element) => {
      const src = element.getAttribute("src");
      if (!src) return;
      if (isValidImageSource(src)) return;
      element.removeAttribute("src");
      changed = true;
    });
    return changed ? doc.body.innerHTML : value;
  } catch {
    return value;
  }
};

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isArchived: boolean;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
  onDescriptionChange?: (value: string) => void;
  mediaItem?: TMediaItem;
  onMediaItemUpdated?: (updates?: Partial<TMediaItem>) => void;
};

export const PeekOverviewIssueDetails: FC<Props> = observer((props) => {
  const {
    editorRef,
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    disabled,
    isArchived,
    isSubmitting,
    setIsSubmitting,
    mediaItem,
    onMediaItemUpdated,
  } = props;
  const { onDescriptionChange } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  // reload confirmation
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
  const hasLinkedIssue = Boolean(issue && issue.project_id);
  const isArtifactOnlyMode = Boolean(mediaItem && !hasLinkedIssue);
  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectDetails?.id,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  if (!hasLinkedIssue && !mediaItem) return <></>;

  const escapeHtml = useCallback(
    (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
    []
  );

  const getMediaDescriptionSeed = useCallback(
    (item?: TMediaItem) => {
      const html = item?.descriptionHtml?.trim();
      if (html) return sanitizeMediaDescriptionHtml(html);
      const text = item?.description?.trim() ?? "";
      if (!text) return "<p></p>";
      return `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`;
    },
    [escapeHtml]
  );

  const mediaTitle = mediaItem?.title ?? "";
  const [mediaDescriptionSeed, setMediaDescriptionSeed] = useState(() => getMediaDescriptionSeed(mediaItem));
  const mediaDescriptionIdRef = useRef<string | null>(mediaItem?.id ?? null);
  useEffect(() => {
    const nextId = mediaItem?.id ?? null;
    if (nextId === mediaDescriptionIdRef.current) return;
    mediaDescriptionIdRef.current = nextId;
    setMediaDescriptionSeed(getMediaDescriptionSeed(mediaItem));
  }, [getMediaDescriptionSeed, mediaItem, mediaItem?.id]);
  const mediaDescriptionHtml = mediaDescriptionSeed || "<p></p>";
  const artifactDescriptionUploadEntity = useMemo<TFileEntityInfo | undefined>(() => {
    if (!isArtifactOnlyMode) return undefined;
    if (!projectId) return undefined;
    return {
      entity_identifier: projectId,
      entity_type: EFileAssetType.PROJECT_COVER,
    };
  }, [isArtifactOnlyMode, projectId]);

  const updateMediaArtifact = useCallback(
    async (data: Partial<TIssue>) => {
      if (!mediaItem?.id || !mediaItem?.packageId) return;
      const payload: { title?: string | null; description?: string | null } = {};
      const updatedFields: Partial<TMediaItem> = {};
      if (data.name !== undefined) {
        const trimmed = data.name?.trim() ?? "";
        payload.title = trimmed ? trimmed : null;
        updatedFields.title = trimmed;
      }
      if (data.description_html !== undefined) {
        const htmlDescription = (data.description_html ?? "").trim();
        payload.description = htmlDescription ? htmlDescription : null;
        updatedFields.descriptionHtml = htmlDescription || undefined;
        updatedFields.description = htmlDescription ? getTextContent(htmlDescription) : "";
      }
      if (Object.keys(payload).length === 0) return;
      await mediaLibraryService.updateManifestArtifacts(workspaceSlug, projectId, mediaItem.packageId, {
        artifact_id: mediaItem.id,
        artifact: payload,
      });
      if (Object.keys(updatedFields).length > 0) {
        onMediaItemUpdated?.(updatedFields);
      }
    },
    [mediaItem, mediaLibraryService, onMediaItemUpdated, projectId, workspaceSlug]
  );

  const titleOps = useMemo<TIssueOperations>(() => {
    if (!mediaItem) return issueOperations;
    return {
      ...issueOperations,
      update: async (_workspaceSlug, _projectId, _issueId, data) => updateMediaArtifact(data),
    };
  }, [issueOperations, mediaItem, updateMediaArtifact]);

  const issueDescription =
    issue?.description_html !== undefined && issue?.description_html !== null && issue?.description_html !== ""
      ? issue.description_html
      : "<p></p>";
  const linkedProjectId = issue?.project_id ?? projectId;
  const resolvedProjectId = hasLinkedIssue ? linkedProjectId : projectId;
  const resolvedIssueId = hasLinkedIssue ? issue!.id : mediaItem?.id ?? issueId;
  const mediaMeta = ((mediaItem?.meta ?? {}) as Record<string, unknown>) || {};
  const mediaLastEditedAt =
    typeof mediaMeta.updated_at === "string" && /^\d{4}-\d{2}-\d{2}/.test(mediaMeta.updated_at)
      ? mediaMeta.updated_at
      : typeof mediaMeta.created_at === "string" && /^\d{4}-\d{2}-\d{2}/.test(mediaMeta.created_at)
        ? mediaMeta.created_at
        : null;
  const showIssueFooterMeta = hasLinkedIssue || Boolean(mediaItem);
  const issueLastEditedAt = issue?.updated_at ?? issue?.created_at ?? null;
  const lastEditedAt = mediaItem ? mediaLastEditedAt ?? issueLastEditedAt : issueLastEditedAt;
  const lastEditedByDisplayName = hasLinkedIssue
    ? getUserDetails(issue?.updated_by ?? issue?.created_by ?? "")?.display_name ?? mediaItem?.author ?? "Deactivated user"
    : mediaItem?.author ?? "Media Library";
  const lastEditedTimeLabel = lastEditedAt ? calculateTimeAgo(lastEditedAt) : mediaItem?.createdAt ? `on ${mediaItem.createdAt}` : "";

  return (
    <div className="space-y-2">
      {hasLinkedIssue && issue?.parent_id && (
        <IssueParentDetail
          workspaceSlug={workspaceSlug}
          projectId={linkedProjectId}
          issueId={issueId}
          issue={issue!}
          issueOperations={issueOperations}
        />
      )}
      {hasLinkedIssue && !isArtifactOnlyMode ? (
        <div className="flex items-center justify-between gap-2">
          <IssueTypeSwitcher issueId={issueId} disabled={isArchived || disabled} />
          {duplicateIssues?.length > 0 && (
            <DeDupeIssuePopoverRoot
              workspaceSlug={workspaceSlug}
              projectId={linkedProjectId}
              rootIssueId={issueId}
              issues={duplicateIssues}
              issueOperations={issueOperations}
            />
          )}
        </div>
      ) : null}
      <IssueTitleInput
        workspaceSlug={workspaceSlug}
        projectId={resolvedProjectId}
        issueId={resolvedIssueId}
        isSubmitting={isSubmitting}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        issueOperations={titleOps}
        disabled={disabled || isArchived}
        value={mediaItem ? mediaTitle : issue?.name}
        containerClassName="-ml-3"
      />

      <IssueDescriptionInput
        editorRef={editorRef}
        workspaceSlug={workspaceSlug}
        projectId={resolvedProjectId}
        issueId={resolvedIssueId}
        initialValue={mediaItem ? mediaDescriptionHtml : issueDescription}
        disabled={disabled || isArchived}
        issueOperations={titleOps}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        containerClassName="-ml-3 border-none"
        onDescriptionChange={onDescriptionChange}
        assetUploadEntityInfo={artifactDescriptionUploadEntity}
      />

      {showIssueFooterMeta ? (
        <div className="flex items-center justify-between gap-2">
          {!mediaItem && currentUser && (
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={linkedProjectId}
              issueId={issueId}
              currentUser={currentUser}
              disabled={isArchived}
            />
          )}
          <>
            {mediaItem ? (
              <div className="ml-auto flex items-center gap-1 text-custom-text-300">
                <span className="flex-shrink-0 size-4 grid place-items-center">
                  <History className="size-3.5" />
                </span>
                <p className="text-xs">
                  Last edited by <span className="font-medium">{lastEditedByDisplayName}</span>{" "}
                  {lastEditedTimeLabel}
                </p>
              </div>
            ) : (
              !disabled && (
                <DescriptionVersionsRoot
                  className="flex-shrink-0"
                  entityInformation={{
                    createdAt: issue!.created_at ? new Date(issue!.created_at) : new Date(),
                    createdByDisplayName: getUserDetails(issue!.created_by ?? "")?.display_name ?? "",
                    id: issueId,
                    isRestoreDisabled: disabled || isArchived,
                  }}
                  fetchHandlers={{
                    listDescriptionVersions: (issueId) =>
                      workItemVersionService.listDescriptionVersions(
                        workspaceSlug,
                        linkedProjectId,
                        issueId
                      ),
                    retrieveDescriptionVersion: (issueId, versionId) =>
                      workItemVersionService.retrieveDescriptionVersion(
                        workspaceSlug,
                        linkedProjectId,
                        issueId,
                        versionId
                      ),
                  }}
                  handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
                  projectId={linkedProjectId}
                  workspaceSlug={workspaceSlug}
                />
              )
            )}
          </>
        </div>
      ) : null}
    </div>
  );
});
