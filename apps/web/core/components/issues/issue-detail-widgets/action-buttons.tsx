"use client";

import type { FC } from "react";
import React, { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Link, Paperclip, UploadCloud, Waypoints } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ViewsIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
// plane imports
import type { TIssueAttachment, TIssueServiceType, TWorkItemWidgets } from "@plane/types";
import { getFileName, getFileURL } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { WorkItemAdditionalWidgetActionButtons } from "@/plane-web/components/issues/issue-detail-widgets/action-buttons";
// services
import { MediaLibraryService } from "@/services/media-library.service";
// local imports
import { IssueAttachmentActionButton } from "./attachments";
import { IssueLinksActionButton } from "./links";
import {
  DOC_FORMATS,
  IMAGE_FORMATS,
  VIDEO_FORMATS,
  buildArtifactName,
  buildEventMeta,
  getErrorMessage,
  isDuplicateArtifactError,
  resolveArtifactAction,
  resolveArtifactFormat,
  resolveAttachmentDownloadUrl,
  resolveAttachmentFileName,
} from "./media-library-utils";
import { RelationActionButton } from "./relations";
import { SubIssuesActionButton } from "./sub-issues";
import { IssueDetailWidgetButton } from "./widget-button";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  hideWidgets?: TWorkItemWidgets[];
  hideMediaLibraryButton?: boolean;
};

type TMediaLibraryAddResult = {
  total: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
};

export {
  DOC_FORMATS,
  IMAGE_FORMATS,
  VIDEO_FORMATS,
  buildArtifactName,
  buildEventMeta,
  getErrorMessage,
  isDuplicateArtifactError,
  resolveArtifactAction,
  resolveArtifactFormat,
  resolveAttachmentDownloadUrl,
  resolveAttachmentFileName,
};
const EMPTY_ATTACHMENT_IDS: string[] = [];

export const IssueDetailWidgetActionButtons: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType, hideWidgets, hideMediaLibraryButton } =
    props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const { issue: issueStore, attachment, fetchAttachments } = useIssueDetail(issueServiceType);
  const { getUserDetails } = useMember();
  // state
  const [isAddingToMediaLibrary, setIsAddingToMediaLibrary] = useState(false);
  // services
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  const issue = issueStore.getIssueById(issueId);
  const createdByDetails = issue?.created_by ? getUserDetails(issue.created_by) : undefined;
  const createdByName = createdByDetails?.display_name?.includes("-intake")
    ? "Plane"
    : createdByDetails?.display_name ?? issue?.created_by ?? "";
  const baseEventMeta = useMemo(() => buildEventMeta(issue, createdByName), [issue, createdByName]);
  const attachmentIds = attachment.getAttachmentsByIssueId(issueId) ?? EMPTY_ATTACHMENT_IDS;
  const attachmentCount = issue?.attachment_count ?? attachmentIds.length;
  const showMediaLibraryButton =
    attachmentCount > 0 && !hideWidgets?.includes("attachments") && !hideMediaLibraryButton;

  const handleAddAssetsToMediaLibrary = useCallback(async (): Promise<TMediaLibraryAddResult> => {
    if (!workspaceSlug || !projectId || !issueId) {
      throw new Error("Missing required fields.");
    }

    setIsAddingToMediaLibrary(true);
    try {
      let resolvedAttachments = attachmentIds
        .map((attachmentId) => attachment.getAttachmentById(attachmentId))
        .filter((item): item is TIssueAttachment => Boolean(item));

      if (resolvedAttachments.length === 0) {
        resolvedAttachments = await fetchAttachments(workspaceSlug, projectId, issueId);
      }

      if (resolvedAttachments.length === 0) {
        throw new Error("No attachments found for this work item.");
      }

      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      const packageId = typeof manifest?.id === "string" ? manifest.id : null;
      if (!packageId) {
        throw new Error("Media library package not available.");
      }

      const result: TMediaLibraryAddResult = {
        total: resolvedAttachments.length,
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

        const assetUrl = getFileURL(attachmentItem.asset_url ?? "");
        if (!assetUrl) {
          result.failedCount += 1;
          continue;
        }

        try {
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
          const artifactName = buildArtifactName(fileName, attachmentItem.id);
          const title = getFileName(fileName) || "Attachment";
          const action = resolveArtifactAction(format);
          const meta: Record<string, unknown> = { ...baseEventMeta };

          if (DOC_FORMATS.has(format)) {
            meta.kind = "document_file";
            meta.file_size = attachmentItem.attributes?.size;
            meta.file_type = format;
          }

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
          throw new Error("Assets already exist in the media library.");
        }
        if (result.skippedCount > 0 && result.failedCount > 0) {
          throw new Error("Some assets could not be added to the media library.");
        }
        throw new Error("Unable to add assets to the media library.");
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
    projectId,
    workspaceSlug,
  ]);

  const handleAddAssetsClick = useCallback(() => {
    if (disabled || isAddingToMediaLibrary) return;
    const addAssetsPromise = handleAddAssetsToMediaLibrary();
    setPromiseToast(addAssetsPromise, {
      loading: "Adding assets to media library...",
      success: {
        title: "Assets added",
        message: (data) => {
          if (!data) return "Assets added to the media library.";
          const { total, successCount, skippedCount, failedCount } = data;
          if (failedCount === 0 && skippedCount === 0) {
            return `${successCount} of ${total} assets added to the media library.`;
          }
          if (failedCount === 0) {
            return `${successCount} of ${total} assets added. ${skippedCount} skipped.`;
          }
          return `${successCount} of ${total} assets added. ${skippedCount} skipped, ${failedCount} failed.`;
        },
      },
      error: {
        title: "Assets not added",
        message: (error) => getErrorMessage(error) || "Unable to add assets to the media library.",
      },
    });
  }, [disabled, handleAddAssetsToMediaLibrary, isAddingToMediaLibrary]);

  return (
    <div className="flex items-center flex-wrap gap-2">
      {!hideWidgets?.includes("sub-work-items") && (
        <SubIssuesActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.sub_issue")}
              icon={<ViewsIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("relations") && (
        <RelationActionButton
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.relation")}
              icon={<Waypoints className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("links") && (
        <IssueLinksActionButton
          customButton={
            <IssueDetailWidgetButton
              title={t("issue.add.link")}
              icon={<Link className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {!hideWidgets?.includes("attachments") && (
        <IssueAttachmentActionButton
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          customButton={
            <IssueDetailWidgetButton
              title={t("common.attach")}
              icon={<Paperclip className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
              disabled={disabled}
            />
          }
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      )}
      {showMediaLibraryButton && (
        <button
          type="button"
          onClick={handleAddAssetsClick}
          disabled={disabled || isAddingToMediaLibrary}
          className="disabled:cursor-not-allowed"
        >
          <IssueDetailWidgetButton
            title="Add assets in media library"
            icon={<UploadCloud className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
            disabled={disabled || isAddingToMediaLibrary}
          />
        </button>
      )}
      <WorkItemAdditionalWidgetActionButtons
        disabled={disabled}
        hideWidgets={hideWidgets ?? []}
        issueServiceType={issueServiceType}
        projectId={projectId}
        workItemId={issueId}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
});
