// oxlint-disable jsx_a11y/prefer-tag-over-role
// oxlint-disable jsx_a11y/click-events-have-key-events
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Button } from "@makeplane/propel/components/button";
import { setToast } from "@plane/blocks/toast";
import type { TIssue } from "@plane/types";
import { Switch } from "@makeplane/propel/components/switch";
import { renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import useKeypress from "@/hooks/use-keypress";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { FileService } from "@/services/file.service";
// local imports
import { InboxIssueDescription } from "./issue-description";
import { InboxIssueProperties } from "./issue-properties";
import { InboxIssueTitle } from "./issue-title";

const fileService = new FileService();

type TInboxIssueCreateRoot = {
  workspaceSlug: string;
  projectId: string;
  handleModalClose: () => void;
  isDuplicateModalOpen: boolean;
  handleDuplicateIssueModal: (value: boolean) => void;
};

export const defaultIssueData: Partial<TIssue> = {
  id: undefined,
  name: "",
  description_html: "",
  priority: "none",
  state_id: "",
  label_ids: [],
  assignee_ids: [],
  start_date: renderFormattedPayloadDate(new Date()),
  target_date: "",
};

export const InboxIssueCreateRoot = observer(function InboxIssueCreateRoot(props: TInboxIssueCreateRoot) {
  const { workspaceSlug, projectId, handleModalClose } = props;
  // states
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // router
  const router = useAppRouter();
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { createInboxIssue } = useProjectInbox();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // states
  const [createMore, setCreateMore] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TIssue>>(defaultIssueData);
  const handleFormData = useCallback(
    <T extends keyof Partial<TIssue>>(issueKey: T, issueValue: Partial<TIssue>[T]) => {
      setFormData({
        ...formData,
        [issueKey]: issueValue,
      });
    },
    [formData]
  );

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);

  const handleEscKeyDown = (event: KeyboardEvent) => {
    if (descriptionEditorRef.current?.isEditorReadyToDiscard()) {
      handleModalClose();
    } else {
      setToast({
        type: "error",
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      event.preventDefault(); // Prevent default action if editor is not ready to discard
    }
  };

  useKeypress("Escape", handleEscKeyDown);

  useEffect(() => {
    const formElement = formRef?.current;
    const modalElement = modalContainerRef?.current;

    if (!formElement || !modalElement) return;

    const resizeObserver = new ResizeObserver(() => {
      modalElement.style.maxHeight = `${formElement?.offsetHeight}px`;
    });

    resizeObserver.observe(formElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [formRef, modalContainerRef]);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!descriptionEditorRef.current?.isEditorReadyToDiscard()) {
      setToast({
        type: "error",
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      return;
    }

    const payload: Partial<TIssue> = {
      name: formData.name || "",
      description_html: formData.description_html || "<p></p>",
      priority: formData.priority || "none",
      state_id: formData.state_id || "",
      label_ids: formData.label_ids || [],
      assignee_ids: formData.assignee_ids || [],
      target_date: formData.target_date || null,
    };
    setFormSubmitting(true);

    await createInboxIssue(workspaceSlug, projectId, payload)
      // oxlint-disable-next-line promise/always-return
      .then(async (res) => {
        if (uploadedAssetIds.length > 0) {
          await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, res?.issue.id ?? "", {
            asset_ids: uploadedAssetIds,
          });
          setUploadedAssetIds([]);
        }
        if (!createMore) {
          router.push(`/${workspaceSlug}/projects/${projectId}/intake/?currentTab=open&inboxIssueId=${res?.issue?.id}`);
          handleModalClose();
        } else {
          descriptionEditorRef?.current?.clearEditor();
          setFormData(defaultIssueData);
        }
        setToast({
          type: "success",
          title: `Success!`,
          message: "Work item created successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
        setToast({
          type: "error",
          title: `Error!`,
          message: "Some error occurred. Please try again.",
        });
      });
    setFormSubmitting(false);
  };

  const isTitleLengthMoreThan255Character = formData?.name ? formData.name.length > 255 : false;

  if (!workspaceSlug || !projectId || !workspaceId) return <></>;
  return (
    // The dialog popup is the card (surface, border, radius, shadow), so this tree no longer draws
    // the rounded/background chrome it needed inside the transparent legacy modal.
    <div className="flex min-h-0 w-full flex-1 gap-2">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <form ref={formRef} onSubmit={handleFormSubmit} className="flex min-h-0 w-full flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{t("inbox_issue.modal.title")}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="space-y-3">
                <InboxIssueTitle
                  data={formData}
                  handleData={handleFormData}
                  isTitleLengthMoreThan255Character={isTitleLengthMoreThan255Character}
                />
                <InboxIssueDescription
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  workspaceId={workspaceId}
                  data={formData}
                  handleData={handleFormData}
                  editorRef={descriptionEditorRef}
                  containerClassName="bg-layer-2 border-[0.5px] border-subtle-1 py-3 min-h-[150px]"
                  onEnterKeyPress={() => submitBtnRef?.current?.click()}
                  onAssetUpload={(assetId) => setUploadedAssetIds((prev) => [...prev, assetId])}
                />
                <InboxIssueProperties
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  data={formData}
                  handleData={handleFormData}
                />
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <DialogInfo>
              {/* A label (not a role="button" div) so clicking the switch or the text toggles once. */}
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <Switch
                  size="sm"
                  checked={createMore}
                  onCheckedChange={() => setCreateMore((prevData) => !prevData)}
                  tabIndex={getIndex("create_more")}
                  aria-label={t("create_more")}
                />
                <span className="text-11">{t("create_more")}</span>
              </label>
            </DialogInfo>
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              type="button"
              onClick={() => {
                if (descriptionEditorRef.current?.isEditorReadyToDiscard()) {
                  handleModalClose();
                } else {
                  setToast({
                    type: "error",
                    title: "Error!",
                    message: "Editor is still processing changes. Please wait before proceeding.",
                  });
                }
              }}
              tabIndex={getIndex("discard_button")}
              label={t("discard")}
            />
            <Button
              variant="primary"
              ref={submitBtnRef}
              type="submit"
              loading={formSubmitting}
              disabled={isTitleLengthMoreThan255Character}
              tabIndex={getIndex("submit_button")}
              size="md"
              stretch="auto"
              label={formSubmitting ? t("creating") : t("create_work_item")}
            />
          </DialogActions>
        </form>
      </div>
    </div>
  );
});
