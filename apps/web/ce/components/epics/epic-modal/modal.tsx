/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { CreateIssueToastActionItems } from "@/components/issues/create-issue-toast-action-items";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueTypes } from "@/hooks/store/use-issue-types";
// services
import { FileService } from "@/services/file.service";
import { IssueService } from "@/services/issue";
// plane web imports
import { IssueModalProvider } from "@/plane-web/components/issues/issue-modal/provider";
// local imports
import { EpicFormRoot } from "./form";

// services — the epic service hits /projects/:projectId/epics/… endpoints
const epicService = new IssueService(EIssueServiceType.EPICS);
const fileService = new FileService();

export interface EpicModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  beforeFormSubmit?: () => Promise<void>;
  onSubmit?: (res: TIssue) => Promise<void>;
  fetchIssueDetails?: boolean;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isProjectSelectionDisabled?: boolean;
}

const CreateUpdateEpicModalBase = observer(function CreateUpdateEpicModalBase(props: EpicModalProps) {
  const { data, isOpen, onClose, beforeFormSubmit, onSubmit, fetchIssueDetails = true, primaryButtonText } = props;
  // NOTE: `isProjectSelectionDisabled` is accepted for interface parity with the
  // EE modal but the CE epic modal always pins the project to the page context.
  // refs
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // states
  const [createMore, setCreateMore] = useState(false);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // store hooks
  const { t } = useTranslation();
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const { issues: projectEpics } = useIssues(EIssuesStoreType.EPIC);
  const { getProjectEpicId } = useIssueTypes();
  const { handleCreateUpdatePropertyValues } = useIssueModal();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = data?.project_id ?? routerProjectId?.toString();
  const epicTypeId = getProjectEpicId(projectId);
  const epicLabel = t("epic.label", { count: 1 });

  // fetch the (rich) description of the epic being edited or duplicated
  useEffect(() => {
    const epicId = data?.id ?? data?.sourceIssueId;

    if (!isOpen) return;
    if (!workspaceSlug || !projectId || !epicId || !fetchIssueDetails) {
      setDescription(data?.description_html || "<p></p>");
      return;
    }

    setDescription(undefined);
    epicService
      .retrieve(workspaceSlug, projectId, epicId)
      .then((response) => setDescription(response?.description_html || "<p></p>"))
      .catch(() => setDescription(data?.description_html || "<p></p>"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, data?.id, data?.sourceIssueId, projectId, workspaceSlug]);

  const handleClose = () => {
    setDescription(undefined);
    onClose();
  };

  const handleCreateEpic = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      const response = await projectEpics.createIssue(workspaceSlug, payload.project_id, payload);

      // update uploaded assets' status
      if (uploadedAssetIds.length > 0) {
        await fileService.updateBulkProjectAssetsUploadStatus(
          workspaceSlug,
          response?.project_id ?? "",
          response?.id ?? "",
          {
            asset_ids: uploadedAssetIds,
          }
        );
        setUploadedAssetIds([]);
      }

      if (!response) throw new Error();

      // persist the custom property values of the epic type
      if (response.id && response.project_id) {
        await handleCreateUpdatePropertyValues({
          issueId: response.id,
          issueTypeId: epicTypeId ?? response.type_id,
          projectId: response.project_id,
          workspaceSlug: workspaceSlug,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("epic.create.success"),
        actionItems: response?.project_id && (
          <CreateIssueToastActionItems
            workspaceSlug={workspaceSlug}
            projectId={response.project_id}
            issueId={response.id}
            isEpic
          />
        ),
      });
      if (!createMore) handleClose();
      if (createMore && issueTitleRef) issueTitleRef?.current?.focus();
      setDescription("<p></p>");
      return response;
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t("epic.create.failed"),
      });
      throw error;
    }
  };

  const handleUpdateEpic = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      await projectEpics.updateIssue(workspaceSlug, payload.project_id, data.id, payload);

      // persist the custom property values of the epic type
      await handleCreateUpdatePropertyValues({
        issueId: data.id,
        issueTypeId: epicTypeId ?? data.type_id,
        projectId: payload.project_id,
        workspaceSlug: workspaceSlug,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("entity.update.success", { entity: epicLabel }),
      });
      handleClose();
      return { ...data, ...payload } as TIssue;
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t("entity.update.failed", { entity: epicLabel }),
      });
      throw error;
    }
  };

  const handleFormSubmit = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !payload.project_id) return;

    let response: TIssue | undefined = undefined;

    try {
      if (beforeFormSubmit) await beforeFormSubmit();
      if (!data?.id) response = await handleCreateEpic(payload);
      else response = await handleUpdateEpic(payload);
    } finally {
      if (response != undefined && onSubmit) await onSubmit(response);
    }
  };

  const handleUpdateUploadedAssetIds = (assetId: string) => setUploadedAssetIds((prev) => [...prev, assetId]);

  // an epic is always scoped to a project — nothing to render without one
  if (!projectId) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="rounded-lg !bg-transparent shadow-none transition-[width] ease-linear"
    >
      <EpicFormRoot
        data={{
          ...data,
          description_html: description,
        }}
        issueTitleRef={issueTitleRef}
        isCreateMoreToggleEnabled={createMore}
        onAssetUpload={handleUpdateUploadedAssetIds}
        onCreateMoreToggleChange={(value) => setCreateMore(value)}
        onClose={handleClose}
        onSubmit={handleFormSubmit}
        projectId={projectId}
        primaryButtonText={primaryButtonText}
      />
    </ModalCore>
  );
});

export const CreateUpdateEpicModal = observer(function CreateUpdateEpicModal(props: EpicModalProps) {
  if (!props.isOpen) return null;
  return (
    <IssueModalProvider>
      <CreateUpdateEpicModalBase {...props} />
    </IssueModalProvider>
  );
});
