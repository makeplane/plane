"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EIssueServiceType, EIssuesStoreType, WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import type { TIssue } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CreateIssueToastActionItems, IssuesModalProps } from "@/components/issues";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useEventTracker, useIssueDetail, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
// local components
import { EpicFormProps, EpicFormRoot } from "./form";

export const CreateUpdateEpicModalBase: React.FC<IssuesModalProps> = observer((props) => {
  const {
    data,
    isOpen,
    onClose,
    beforeFormSubmit,
    onSubmit,
    fetchIssueDetails = true,
    primaryButtonText,
    isProjectSelectionDisabled = false,
    isConversionOperation = false,
  } = props;
  // ref
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // states
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  const { projectsWithCreatePermissions } = useUser();
  const { fetchIssue } = useIssueDetail(EIssueServiceType.EPICS);
  const { handleCreateUpdatePropertyValues, handleConvert } = useIssueModal();
  // pathname
  const pathname = usePathname();
  // current store details
  const { createIssue, updateIssue } = useIssuesActions(EIssuesStoreType.EPIC);
  // derived values
  const projectId = data?.project_id ?? routerProjectId?.toString();
  const projectIdsWithCreatePermissions = Object.keys(projectsWithCreatePermissions ?? {});

  const fetchIssueDetail = async (issueId: string | undefined) => {
    setDescription(undefined);
    if (!workspaceSlug) return;

    if (!projectId || issueId === undefined || !fetchIssueDetails) {
      // Set description to the issue description from the props if available
      setDescription(data?.description_html || "<p></p>");
      return;
    }
    const response = await fetchIssue(workspaceSlug.toString(), projectId.toString(), issueId);
    if (response) setDescription(response?.description_html || "<p></p>");
  };

  useEffect(() => {
    // fetching issue details
    if (isOpen) fetchIssueDetail(data?.id);

    // if modal is closed, reset active project to null
    // and return to avoid activeProjectId being set to some other project
    if (!isOpen) {
      setActiveProjectId(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project_id) {
      setActiveProjectId(data.project_id);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projectIdsWithCreatePermissions && projectIdsWithCreatePermissions.length > 0 && !activeProjectId)
      setActiveProjectId(projectId?.toString() ?? projectIdsWithCreatePermissions?.[0]);

    // clearing up the description state when we leave the component
    return () => setDescription(undefined);
  }, [data, projectId, isOpen, activeProjectId]);

  const handleClose = () => {
    setActiveProjectId(null);
    onClose();
  };

  const handleCreateIssue = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      let response: TIssue | undefined;
      if (createIssue) {
        response = await createIssue(payload.project_id, payload);
      }

      // update uploaded assets' status
      if (uploadedAssetIds.length > 0) {
        await fileService.updateBulkProjectAssetsUploadStatus(
          workspaceSlug?.toString() ?? "",
          activeProjectId ?? "",
          response?.id ?? "",
          {
            asset_ids: uploadedAssetIds,
          }
        );
        setUploadedAssetIds([]);
      }

      if (!response) throw new Error();

      // add other property values
      if (response.id && response.project_id) {
        await handleCreateUpdatePropertyValues({
          issueId: response.id,
          issueTypeId: response.type_id,
          projectId: response.project_id,
          workspaceSlug: workspaceSlug?.toString(),
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Epic created successfully.",
        actionItems: response?.project_id && (
          <CreateIssueToastActionItems
            workspaceSlug={workspaceSlug.toString()}
            projectId={response?.project_id}
            issueId={response.id}
            isEpic
          />
        ),
      });
      captureIssueEvent({
        eventName: WORK_ITEM_TRACKER_EVENTS.create,
        payload: { ...response, state: "SUCCESS" },
        path: pathname,
      });
      setDescription("<p></p>");
      return response;
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Epic could not be created. Please try again.",
      });
      captureIssueEvent({
        eventName: WORK_ITEM_TRACKER_EVENTS.create,
        payload: { ...payload, state: "FAILED" },
        path: pathname,
      });
      throw error;
    }
  };

  const handleUpdateIssue = async (
    payload: Partial<TIssue>,
    showToast: boolean = true
  ): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      if (updateIssue) await updateIssue(payload.project_id, data.id, payload);

      // add other property values
      await handleCreateUpdatePropertyValues({
        issueId: data.id,
        issueTypeId: payload.type_id,
        projectId: payload.project_id,
        workspaceSlug: workspaceSlug?.toString(),
      });

      if (showToast) {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Epic updated successfully.",
        });
      }

      captureIssueEvent({
        eventName: WORK_ITEM_TRACKER_EVENTS.update,
        payload: { ...payload, issueId: data.id, state: "SUCCESS" },
        path: pathname,
      });
      handleClose();
    } catch (error) {
      console.error(error);
      if (showToast) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Epic could not be updated. Please try again.",
        });
      }
      captureIssueEvent({
        eventName: WORK_ITEM_TRACKER_EVENTS.update,
        payload: { ...payload, state: "FAILED" },
        path: pathname,
      });
    }
  };

  const handleFormSubmit = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !payload.project_id) return;
    // remove sourceIssueId from payload since it is not needed
    if (data?.sourceIssueId) delete data.sourceIssueId;

    let response: TIssue | undefined = undefined;

    try {
      if (beforeFormSubmit) await beforeFormSubmit();
      if (!data?.id) response = await handleCreateIssue(payload);
      else {
        if (isConversionOperation) handleConvert(workspaceSlug.toString(), data);
        response = await handleUpdateIssue(payload, !isConversionOperation);
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      if (response != undefined && onSubmit) await onSubmit(response);
    }
  };

  const handleUpdateUploadedAssetIds = (assetId: string) => setUploadedAssetIds((prev) => [...prev, assetId]);

  // don't open the modal if there are no projects
  if (!projectIdsWithCreatePermissions || projectIdsWithCreatePermissions.length === 0 || !activeProjectId) return null;

  const commonIssueModalProps: EpicFormProps = {
    issueTitleRef: issueTitleRef,
    data: {
      ...data,
      description_html: description,
    },
    onAssetUpload: handleUpdateUploadedAssetIds,
    onClose: handleClose,
    onSubmit: (payload) => handleFormSubmit(payload),
    projectId: activeProjectId,
    primaryButtonText: primaryButtonText,
    isProjectSelectionDisabled: isProjectSelectionDisabled,
    modalTitle: isConversionOperation ? "Turn this work item into an epic" : undefined,
  };

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="!bg-transparent rounded-lg shadow-none transition-[width] ease-linear"
    >
      <EpicFormRoot {...commonIssueModalProps} />
    </ModalCore>
  );
});
