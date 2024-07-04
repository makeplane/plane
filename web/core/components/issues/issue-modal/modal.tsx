"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// types
import type { TIssue } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
import { CreateIssueToastActionItems } from "@/components/issues";
// constants
import { ISSUE_CREATED, ISSUE_UPDATED } from "@/constants/event-tracker";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useEventTracker, useCycle, useIssues, useModule, useProject, useIssueDetail } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
// components
import { DraftIssueLayout } from "./draft-issue-layout";
import { IssueFormRoot } from "./form";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (res: TIssue) => Promise<void>;
  withDraftIssueWrapper?: boolean;
  storeType?: EIssuesStoreType;
  isDraft?: boolean;
}

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const {
    data,
    isOpen,
    onClose,
    onSubmit,
    withDraftIssueWrapper = true,
    storeType = EIssuesStoreType.PROJECT,
    isDraft = false,
  } = props;
  // ref
  const issueTitleRef = useRef<HTMLInputElement>(null);
  // states
  const [changesMade, setChangesMade] = useState<Partial<TIssue> | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState<string | undefined>(undefined);
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  const { workspaceSlug, projectId, cycleId, moduleId } = useParams();
  const { workspaceProjectIds } = useProject();
  const { fetchCycleDetails } = useCycle();
  const { fetchModuleDetails } = useModule();
  const { issues } = useIssues(storeType);
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: draftIssues } = useIssues(EIssuesStoreType.DRAFT);
  const { fetchIssue } = useIssueDetail();
  // pathname
  const pathname = usePathname();
  // local storage
  const { storedValue: localStorageDraftIssues, setValue: setLocalStorageDraftIssue } = useLocalStorage<
    Record<string, Partial<TIssue>>
  >("draftedIssue", {});
  // current store details
  const { createIssue, updateIssue } = useIssuesActions(storeType);

  const fetchIssueDetail = async (issueId: string | undefined) => {
    setDescription(undefined);
    if (!workspaceSlug) return;

    if (!projectId || issueId === undefined) {
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
    if (workspaceProjectIds && workspaceProjectIds.length > 0 && !activeProjectId)
      setActiveProjectId(projectId?.toString() ?? workspaceProjectIds?.[0]);

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

  const handleClose = (saveDraftIssueInLocalStorage?: boolean) => {
    if (changesMade && saveDraftIssueInLocalStorage) {
      // updating the current edited issue data in the local storage
      let draftIssues = localStorageDraftIssues ? localStorageDraftIssues : {};
      if (workspaceSlug) {
        draftIssues = { ...draftIssues, [workspaceSlug.toString()]: changesMade };
        setLocalStorageDraftIssue(draftIssues);
      }
    }

    setActiveProjectId(null);
    setChangesMade(null);
    onClose();
  };

  const handleCreateIssue = async (
    payload: Partial<TIssue>,
    is_draft_issue: boolean = false
  ): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      let response;

      // if draft issue, use draft issue store to create issue
      if (is_draft_issue) {
        response = await draftIssues.createIssue(workspaceSlug.toString(), payload.project_id, payload);
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

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `${is_draft_issue ? "Draft issue" : "Issue"} created successfully.`,
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
      !createMore && handleClose();
      if (createMore) issueTitleRef && issueTitleRef?.current?.focus();
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
    }
  };

  const handleUpdateIssue = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      isDraft
        ? await draftIssues.updateIssue(workspaceSlug.toString(), payload.project_id, data.id, payload)
        : updateIssue && (await updateIssue(payload.project_id, data.id, payload));

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

    let response: TIssue | undefined = undefined;
    if (!data?.id) response = await handleCreateIssue(payload, is_draft_issue);
    else response = await handleUpdateIssue(payload);

    if (response != undefined && onSubmit) await onSubmit(response);
  };

  const handleFormChange = (formData: Partial<TIssue> | null) => setChangesMade(formData);

  // don't open the modal if there are no projects
  if (!workspaceProjectIds || workspaceProjectIds.length === 0 || !activeProjectId) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => handleClose(true)}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
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
          onChange={handleFormChange}
          onClose={handleClose}
          onSubmit={handleFormSubmit}
          projectId={activeProjectId}
          isCreateMoreToggleEnabled={createMore}
          onCreateMoreToggleChange={handleCreateMoreToggleChange}
          isDraft={isDraft}
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
          onClose={() => handleClose(false)}
          isCreateMoreToggleEnabled={createMore}
          onCreateMoreToggleChange={handleCreateMoreToggleChange}
          onSubmit={handleFormSubmit}
          projectId={activeProjectId}
          isDraft={isDraft}
        />
      )}
    </ModalCore>
  );
});
