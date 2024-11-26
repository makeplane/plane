"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// types
import type { TBaseIssue, TIssue } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
import { CreateIssueToastActionItems, IssuesModalProps } from "@/components/issues";
// constants
import { ISSUE_CREATED, ISSUE_UPDATED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useEventTracker, useCycle, useIssues, useModule, useIssueDetail, useUser } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
// local components
import { DraftIssueLayout } from "./draft-issue-layout";
import { IssueFormRoot } from "./form";

export const CreateUpdateIssueModalBase: React.FC<IssuesModalProps> = observer((props) => {
  const {
    data,
    isOpen,
    onClose,
    beforeFormSubmit,
    onSubmit,
    withDraftIssueWrapper = true,
    storeType: issueStoreFromProps,
    isDraft = false,
    fetchIssueDetails = true,
    moveToIssue = false,
    modalTitle,
    primaryButtonText,
    isProjectSelectionDisabled = false,
  } = props;
  const issueStoreType = useIssueStoreType();

  const storeType = issueStoreFromProps ?? issueStoreType;
  // ref
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // states
  const [changesMade, setChangesMade] = useState<Partial<TIssue> | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [uploadedAssetIds, setUploadedAssetIds] = useState<string[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  const { workspaceSlug, projectId: routerProjectId, cycleId, moduleId } = useParams();
  const { projectsWithCreatePermissions } = useUser();
  const { fetchCycleDetails } = useCycle();
  const { fetchModuleDetails } = useModule();
  const { issues } = useIssues(storeType);
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: draftIssues } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);
  const { fetchIssue } = useIssueDetail();
  const { handleCreateUpdatePropertyValues } = useIssueModal();
  // pathname
  const pathname = usePathname();
  // current store details
  const { createIssue, updateIssue } = useIssuesActions(storeType);
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
    const response = await fetchIssue(
      workspaceSlug.toString(),
      projectId.toString(),
      issueId,
      isDraft ? "DRAFT" : "DEFAULT"
    );
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

  const addIssueToCycle = async (issue: TIssue, cycleId: string) => {
    if (!workspaceSlug || !issue.project_id) return;

    await issues.addIssueToCycle(workspaceSlug.toString(), issue.project_id, cycleId, [issue.id]);
    fetchCycleDetails(workspaceSlug.toString(), issue.project_id, cycleId);
  };

  const addIssueToModule = async (issue: TIssue, moduleIds: string[]) => {
    if (!workspaceSlug || !activeProjectId) return;

    await issues.changeModulesInIssue(workspaceSlug.toString(), activeProjectId, issue.id, moduleIds, []);
    moduleIds.forEach((moduleId) => fetchModuleDetails(workspaceSlug.toString(), activeProjectId, moduleId));
  };

  const handleCreateMoreToggleChange = (value: boolean) => {
    setCreateMore(value);
  };

  const handleClose = (saveAsDraft?: boolean) => {
    if (changesMade && saveAsDraft && !data) {
      handleCreateIssue(changesMade, true);
    }

    setActiveProjectId(null);
    setChangesMade(null);
    onClose();
    handleDuplicateIssueModal(false);
  };

  const handleCreateIssue = async (
    payload: Partial<TIssue>,
    is_draft_issue: boolean = false
  ): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      let response: TIssue | undefined;
      // if draft issue, use draft issue store to create issue
      if (is_draft_issue) {
        response = (await draftIssues.createIssue(workspaceSlug.toString(), payload)) as TIssue;
      }
      // if cycle id in payload does not match the cycleId in url
      // or if the moduleIds in Payload does not match the moduleId in url
      // use the project issue store to create issues
      else if (
        (payload.cycle_id !== cycleId && storeType === EIssuesStoreType.CYCLE) ||
        (!payload.module_ids?.includes(moduleId?.toString()) && storeType === EIssuesStoreType.MODULE)
      ) {
        response = await projectIssues.createIssue(workspaceSlug.toString(), payload.project_id, payload);
      } // else just use the existing store type's create method
      else if (createIssue) {
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

      // check if we should add issue to cycle/module
      if (
        payload.cycle_id &&
        payload.cycle_id !== "" &&
        (payload.cycle_id !== cycleId || storeType !== EIssuesStoreType.CYCLE)
      ) {
        await addIssueToCycle(response, payload.cycle_id);
      }
      if (
        payload.module_ids &&
        payload.module_ids.length > 0 &&
        (!payload.module_ids.includes(moduleId?.toString()) || storeType !== EIssuesStoreType.MODULE)
      ) {
        await addIssueToModule(response, payload.module_ids);
      }

      // add other property values
      if (response.id && response.project_id) {
        await handleCreateUpdatePropertyValues({
          issueId: response.id,
          issueTypeId: response.type_id,
          projectId: response.project_id,
          workspaceSlug: workspaceSlug.toString(),
          isDraft: is_draft_issue,
        });
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `${is_draft_issue ? "Draft created." : "Issue created successfully."} `,
        actionItems: !is_draft_issue && response?.project_id && (
          <CreateIssueToastActionItems
            workspaceSlug={workspaceSlug.toString()}
            projectId={response?.project_id}
            issueId={response.id}
          />
        ),
      });
      captureIssueEvent({
        eventName: ISSUE_CREATED,
        payload: { ...response, state: "SUCCESS" },
        path: pathname,
      });
      if (!createMore) handleClose();
      if (createMore && issueTitleRef) issueTitleRef?.current?.focus();
      setDescription("<p></p>");
      setChangesMade(null);
      return response;
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `${is_draft_issue ? "Draft issue" : "Issue"} could not be created. Please try again.`,
      });
      captureIssueEvent({
        eventName: ISSUE_CREATED,
        payload: { ...payload, state: "FAILED" },
        path: pathname,
      });
      throw error;
    }
  };

  const handleUpdateIssue = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      if (isDraft) await draftIssues.updateIssue(workspaceSlug.toString(), data.id, payload);
      else if (updateIssue) await updateIssue(payload.project_id, data.id, payload);

      // check if we should add issue to cycle/module
      if (
        payload.cycle_id &&
        payload.cycle_id !== "" &&
        (payload.cycle_id !== cycleId || storeType !== EIssuesStoreType.CYCLE)
      ) {
        await addIssueToCycle(data as TBaseIssue, payload.cycle_id);
      }
      if (
        payload.module_ids &&
        payload.module_ids.length > 0 &&
        (!payload.module_ids.includes(moduleId?.toString()) || storeType !== EIssuesStoreType.MODULE)
      ) {
        await addIssueToModule(data as TBaseIssue, payload.module_ids);
      }

      // add other property values
      await handleCreateUpdatePropertyValues({
        issueId: data.id,
        issueTypeId: payload.type_id,
        projectId: payload.project_id,
        workspaceSlug: workspaceSlug.toString(),
        isDraft: isDraft,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Issue updated successfully.",
      });
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...payload, issueId: data.id, state: "SUCCESS" },
        path: pathname,
      });
      handleClose();
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Issue could not be updated. Please try again.",
      });
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...payload, state: "FAILED" },
        path: pathname,
      });
    }
  };

  const handleFormSubmit = async (payload: Partial<TIssue>, is_draft_issue: boolean = false) => {
    if (!workspaceSlug || !payload.project_id || !storeType) return;
    // remove sourceIssueId from payload since it is not needed
    if (data?.sourceIssueId) delete data.sourceIssueId;

    let response: TIssue | undefined = undefined;

    try {
      if (beforeFormSubmit) await beforeFormSubmit();
      if (!data?.id) response = await handleCreateIssue(payload, is_draft_issue);
      else response = await handleUpdateIssue(payload);
    } catch (error) {
      throw error;
    } finally {
      if (response != undefined && onSubmit) await onSubmit(response);
    }
  };

  const handleFormChange = (formData: Partial<TIssue> | null) => setChangesMade(formData);

  const handleUpdateUploadedAssetIds = (assetId: string) => setUploadedAssetIds((prev) => [...prev, assetId]);

  const handleDuplicateIssueModal = (value: boolean) => setIsDuplicateModalOpen(value);

  // don't open the modal if there are no projects
  if (!projectIdsWithCreatePermissions || projectIdsWithCreatePermissions.length === 0 || !activeProjectId) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => handleClose(true)}
      position={EModalPosition.TOP}
      width={isDuplicateModalOpen ? EModalWidth.VIXL : EModalWidth.XXXXL}
      className="!bg-transparent rounded-lg shadow-none transition-[width] ease-linear"
    >
      {withDraftIssueWrapper ? (
        <DraftIssueLayout
          changesMade={changesMade}
          data={{
            ...data,
            description_html: description,
            cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId.toString() : null,
            module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId.toString()] : null,
          }}
          issueTitleRef={issueTitleRef}
          onAssetUpload={handleUpdateUploadedAssetIds}
          onChange={handleFormChange}
          onClose={handleClose}
          onSubmit={(payload) => handleFormSubmit(payload, isDraft)}
          projectId={activeProjectId}
          isCreateMoreToggleEnabled={createMore}
          onCreateMoreToggleChange={handleCreateMoreToggleChange}
          isDraft={isDraft}
          moveToIssue={moveToIssue}
          isDuplicateModalOpen={isDuplicateModalOpen}
          handleDuplicateIssueModal={handleDuplicateIssueModal}
          isProjectSelectionDisabled={isProjectSelectionDisabled}
        />
      ) : (
        <IssueFormRoot
          issueTitleRef={issueTitleRef}
          data={{
            ...data,
            description_html: description,
            cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId.toString() : null,
            module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId.toString()] : null,
          }}
          onAssetUpload={handleUpdateUploadedAssetIds}
          onClose={handleClose}
          isCreateMoreToggleEnabled={createMore}
          onCreateMoreToggleChange={handleCreateMoreToggleChange}
          onSubmit={(payload) => handleFormSubmit(payload, isDraft)}
          projectId={activeProjectId}
          isDraft={isDraft}
          moveToIssue={moveToIssue}
          modalTitle={modalTitle}
          primaryButtonText={primaryButtonText}
          isDuplicateModalOpen={isDuplicateModalOpen}
          handleDuplicateIssueModal={handleDuplicateIssueModal}
          isProjectSelectionDisabled={isProjectSelectionDisabled}
        />
      )}
    </ModalCore>
  );
});
