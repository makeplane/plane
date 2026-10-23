/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { UploadOutline } from "@makeplane/propel/icons";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useFileSize } from "@/hooks/use-file-size";
// local imports
import { useAttachmentOperations } from "../issue-detail-widgets/attachments/helper";

/** max number of files accepted in one drop */
export const MAX_FILES_PER_DROP = 10;

/** drops on the description editor are handled by the editor itself (inline images) */
const isInsideEditor = (target: EventTarget | null | undefined) =>
  !!(target as Element | null)?.closest?.(".ProseMirror, [contenteditable='true']");

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  issueServiceType?: TIssueServiceType;
  className?: string;
  children: ReactNode;
};

/**
 * d2m-plane: ClickUp-like drop zone covering the whole work item detail (peek overview / detail page).
 * Drag one or more files anywhere over it and they are uploaded, one after another, as attachments —
 * even when the work item has no attachments yet. Drops on the description editor are left to the editor.
 */
export const WorkItemAttachmentDropZone = observer(function WorkItemAttachmentDropZone(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    disabled = false,
    issueServiceType = EIssueServiceType.ISSUES,
    className,
    children,
  } = props;
  const { t } = useTranslation();
  const [isOverEditor, setIsOverEditor] = useState(false);
  // store hooks
  const { fetchActivities } = useIssueDetail(issueServiceType);
  const { operations } = useAttachmentOperations(workspaceSlug, projectId, issueId, issueServiceType);
  const { maxFileSize } = useFileSize();

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[], event: unknown) => {
      setIsOverEditor(false);
      if (isInsideEditor((event as Event | undefined)?.target)) return;

      if (fileRejections.some((rejection) => rejection.errors.some((error) => error.code === "too-many-files"))) {
        setToast({
          type: "error",
          title: t("toast.error"),
          message: t("d2m_quick_actions.too_many_files", { max: MAX_FILES_PER_DROP }),
        });
        return;
      }
      if (fileRejections.length > 0) {
        setToast({
          type: "warning",
          title: t("toast.error"),
          message: t("d2m_quick_actions.files_too_large", {
            size: Math.round(maxFileSize / 1024 / 1024),
            names: fileRejections.map((rejection) => rejection.file.name).join(", "),
          }),
        });
      }
      if (acceptedFiles.length === 0) return;

      // upload one after another; each upload shows its own progress row + toast
      for (const file of acceptedFiles) {
        try {
          await operations.create(file);
        } catch {
          // the per-file toast already reports the failure
        }
      }
      fetchActivities(workspaceSlug, projectId, issueId);
    },
    [operations, maxFileSize, fetchActivities, workspaceSlug, projectId, issueId, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, fileRejections, event) => void onDrop(acceptedFiles, fileRejections, event),
    maxSize: maxFileSize,
    maxFiles: MAX_FILES_PER_DROP,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    disabled,
  });

  return (
    <div
      {...getRootProps({
        className: cn("relative", className),
        onDragOver: (event) => {
          const overEditor = isInsideEditor(event.target);
          if (overEditor !== isOverEditor) setIsOverEditor(overEditor);
        },
      })}
    >
      <input {...getInputProps()} />
      {children}
      {isDragActive && !isOverEditor && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-surface-2/80 p-4">
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent-strong bg-surface-1 px-10 py-8 text-center">
            <UploadOutline className="size-8 text-accent-primary" />
            <span className="text-body-sm-medium text-primary">{t("d2m_quick_actions.drop_to_attach")}</span>
            <span className="text-caption-md-regular text-tertiary">
              {t("d2m_quick_actions.drop_to_attach_hint")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
