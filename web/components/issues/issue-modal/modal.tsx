import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import {
  useApplication,
  useEventTracker,
  useCycle,
  useIssues,
  useModule,
  useProject,
  useWorkspace,
  useIssueDetail,
} from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { DraftIssueLayout } from "./draft-issue-layout";
import { IssueFormRoot } from "./form";
// types
import type { TIssue } from "@plane/types";
// constants
import { EIssuesStoreType, TCreateModalStoreTypes } from "constants/issue";
import { ISSUE_CREATED, ISSUE_UPDATED } from "constants/event-tracker";

export interface IssuesModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (res: TIssue) => Promise<void>;
  withDraftIssueWrapper?: boolean;
  storeType?: TCreateModalStoreTypes;
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
  // states
  const [changesMade, setChangesMade] = useState<Partial<TIssue> | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState<string | undefined>(undefined);
  // store hooks
  const { captureIssueEvent } = useEventTracker();
  const {
    router: { workspaceSlug, projectId, cycleId, moduleId, viewId: projectViewId },
  } = useApplication();
  const { workspaceProjectIds } = useProject();
  const { fetchCycleDetails } = useCycle();
  const { fetchModuleDetails } = useModule();
  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: moduleIssues } = useIssues(EIssuesStoreType.MODULE);
  const { issues: cycleIssues } = useIssues(EIssuesStoreType.CYCLE);
  const { issues: viewIssues } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { issues: profileIssues } = useIssues(EIssuesStoreType.PROFILE);
  const { issues: draftIssues } = useIssues(EIssuesStoreType.DRAFT);
  const { fetchIssue } = useIssueDetail();
  // store mapping based on current store
  const issueStores = {
    [EIssuesStoreType.PROJECT]: {
      store: projectIssues,
      viewId: undefined,
    },
    [EIssuesStoreType.PROJECT_VIEW]: {
      store: viewIssues,
      viewId: projectViewId,
    },
    [EIssuesStoreType.PROFILE]: {
      store: profileIssues,
      viewId: undefined,
    },
    [EIssuesStoreType.CYCLE]: {
      store: cycleIssues,
      viewId: cycleId,
    },
    [EIssuesStoreType.MODULE]: {
      store: moduleIssues,
      viewId: moduleId,
    },
  };
  // router
  const router = useRouter();
  // toast alert
  const { setToastAlert } = useToast();
  // local storage
  const { storedValue: localStorageDraftIssues, setValue: setLocalStorageDraftIssue } = useLocalStorage<
    Record<string, Partial<TIssue>>
  >("draftedIssue", {});
  // current store details
  const { store: currentIssueStore, viewId } = issueStores[storeType];

  const fetchIssueDetail = async (issueId: string | undefined) => {
    if (!workspaceSlug) return;
    if (!projectId || issueId === undefined) {
      setDescription("<p></p>");
      return;
    }
    const response = await fetchIssue(workspaceSlug, projectId, issueId, isDraft ? "DRAFT" : "DEFAULT");
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
      setActiveProjectId(projectId ?? workspaceProjectIds?.[0]);

    // clearing up the description state when we leave the component
    return () => setDescription(undefined);
  }, [data, projectId, workspaceProjectIds, isOpen, activeProjectId]);

  const addIssueToCycle = async (issue: TIssue, cycleId: string) => {
    if (!workspaceSlug || !activeProjectId) return;

    await cycleIssues.addIssueToCycle(workspaceSlug, issue.project_id, cycleId, [issue.id]);
    fetchCycleDetails(workspaceSlug, activeProjectId, cycleId);
  };

  const addIssueToModule = async (issue: TIssue, moduleIds: string[]) => {
    if (!workspaceSlug || !activeProjectId) return;

    await moduleIssues.addModulesToIssue(workspaceSlug, activeProjectId, issue.id, moduleIds);
    moduleIds.forEach((moduleId) => fetchModuleDetails(workspaceSlug, activeProjectId, moduleId));
  };

  const handleCreateMoreToggleChange = (value: boolean) => {
    setCreateMore(value);
  };

  const handleClose = (saveDraftIssueInLocalStorage?: boolean) => {
    if (changesMade && saveDraftIssueInLocalStorage) {
      // updating the current edited issue data in the local storage
      let draftIssues = localStorageDraftIssues ? localStorageDraftIssues : {};
      if (workspaceSlug) {
        draftIssues = { ...draftIssues, [workspaceSlug]: changesMade };
        setLocalStorageDraftIssue(draftIssues);
      }
    }

    setActiveProjectId(null);
    onClose();
  };

  const handleCreateIssue = async (
    payload: Partial<TIssue>,
    is_draft_issue: boolean = false
  ): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id) return;

    try {
      const response = is_draft_issue
        ? await draftIssues.createIssue(workspaceSlug, payload.project_id, payload)
        : await currentIssueStore.createIssue(workspaceSlug, payload.project_id, payload, viewId);
      if (!response) throw new Error();

      currentIssueStore.fetchIssues(workspaceSlug, payload.project_id, "mutation", viewId);

      if (payload.cycle_id && payload.cycle_id !== "" && storeType !== EIssuesStoreType.CYCLE)
        await addIssueToCycle(response, payload.cycle_id);
      if (payload.module_ids && payload.module_ids.length > 0 && storeType !== EIssuesStoreType.MODULE)
        await addIssueToModule(response, payload.module_ids);

      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Issue created successfully.",
      });
      captureIssueEvent({
        eventName: ISSUE_CREATED,
        payload: { ...response, state: "SUCCESS" },
        path: router.asPath,
      });
      !createMore && handleClose();
      return response;
    } catch (error) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Issue could not be created. Please try again.",
      });
      captureIssueEvent({
        eventName: ISSUE_CREATED,
        payload: { ...payload, state: "FAILED" },
        path: router.asPath,
      });
    }
  };

  const handleUpdateIssue = async (payload: Partial<TIssue>): Promise<TIssue | undefined> => {
    if (!workspaceSlug || !payload.project_id || !data?.id) return;

    try {
      isDraft
        ? await draftIssues.updateIssue(workspaceSlug, payload.project_id, data.id, payload)
        : await currentIssueStore.updateIssue(workspaceSlug, payload.project_id, data.id, payload, viewId);

      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Issue updated successfully.",
      });
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...payload, issueId: data.id, state: "SUCCESS" },
        path: router.asPath,
      });
      handleClose();
    } catch (error) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Issue could not be created. Please try again.",
      });
      captureIssueEvent({
        eventName: ISSUE_UPDATED,
        payload: { ...payload, state: "FAILED" },
        path: router.asPath,
      });
    }
  };

  const handleFormSubmit = async (formData: Partial<TIssue>, is_draft_issue: boolean = false) => {
    if (!workspaceSlug || !formData.project_id || !storeType) return;

    const payload: Partial<TIssue> = {
      ...formData,
      description_html: formData.description_html ?? "<p></p>",
    };

    let response: TIssue | undefined = undefined;
    if (!data?.id) response = await handleCreateIssue(payload, is_draft_issue);
    else response = await handleUpdateIssue(payload);

    if (response != undefined && onSubmit) await onSubmit(response);
  };

  const handleFormChange = (formData: Partial<TIssue> | null) => setChangesMade(formData);

  // don't open the modal if there are no projects
  if (!workspaceProjectIds || workspaceProjectIds.length === 0 || !activeProjectId) return null;

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => handleClose(true)}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full mx-4 sm:max-w-4xl">
                {withDraftIssueWrapper ? (
                  <DraftIssueLayout
                    changesMade={changesMade}
                    data={{
                      ...data,
                      description_html: description,
                      cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId : null,
                      module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId] : null,
                    }}
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
                    data={{
                      ...data,
                      description_html: description,
                      cycle_id: data?.cycle_id ? data?.cycle_id : cycleId ? cycleId : null,
                      module_ids: data?.module_ids ? data?.module_ids : moduleId ? [moduleId] : null,
                    }}
                    onClose={() => handleClose(false)}
                    isCreateMoreToggleEnabled={createMore}
                    onCreateMoreToggleChange={handleCreateMoreToggleChange}
                    onSubmit={handleFormSubmit}
                    projectId={activeProjectId}
                    isDraft={isDraft}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
