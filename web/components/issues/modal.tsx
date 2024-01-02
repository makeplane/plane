import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useApplication, useCycle, useIssues, useModule, useProject, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// services
import { IssueDraftService } from "services/issue";
// components
import { IssueForm, ConfirmIssueDiscard } from "components/issues";
// types
import type { TIssue } from "@plane/types";
// fetch-keys
import { USER_ISSUE, SUB_ISSUES } from "constants/fetch-keys";
import { EIssuesStoreType, TCreateModalStoreTypes } from "constants/issue";

export interface IssuesModalProps {
  data?: TIssue | null;
  handleClose: () => void;
  isOpen: boolean;
  prePopulateData?: Partial<TIssue>;
  fieldsToShow?: (
    | "project"
    | "name"
    | "description"
    | "state"
    | "priority"
    | "assignee"
    | "label"
    | "startDate"
    | "dueDate"
    | "estimate"
    | "parent"
    | "all"
    | "module"
    | "cycle"
  )[];
  onSubmit?: (data: Partial<TIssue>) => Promise<void>;
  handleSubmit?: (data: Partial<TIssue>) => Promise<void>;
  currentStore?: TCreateModalStoreTypes;
}

const issueDraftService = new IssueDraftService();

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const {
    data,
    handleClose,
    isOpen,
    prePopulateData: prePopulateDataProps,
    fieldsToShow = ["all"],
    onSubmit,
    handleSubmit,
    currentStore = EIssuesStoreType.PROJECT,
  } = props;
  // states
  const [createMore, setCreateMore] = useState(false);
  const [formDirtyState, setFormDirtyState] = useState<any>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<TIssue>>({});
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string | undefined;
    cycleId: string | undefined;
    moduleId: string | undefined;
  };
  // store hooks

  const { issues: projectIssues } = useIssues(EIssuesStoreType.PROJECT);
  const { issues: moduleIssues } = useIssues(EIssuesStoreType.MODULE);
  const { issues: cycleIssues } = useIssues(EIssuesStoreType.CYCLE);
  const { issues: viewIssues } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { issues: profileIssues } = useIssues(EIssuesStoreType.PROFILE);

  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentUser } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { workspaceProjectIds } = useProject();
  const { fetchCycleDetails } = useCycle();
  const { fetchModuleDetails } = useModule();

  const issueStores = {
    [EIssuesStoreType.PROJECT]: {
      store: projectIssues,
      dataIdToUpdate: activeProject,
      viewId: undefined,
    },
    [EIssuesStoreType.PROJECT_VIEW]: {
      store: viewIssues,
      dataIdToUpdate: activeProject,
      viewId: undefined,
    },
    [EIssuesStoreType.PROFILE]: {
      store: profileIssues,
      dataIdToUpdate: currentUser?.id || undefined,
      viewId: undefined,
    },
    [EIssuesStoreType.CYCLE]: {
      store: cycleIssues,
      dataIdToUpdate: activeProject,
      viewId: cycleId,
    },
    [EIssuesStoreType.MODULE]: {
      store: moduleIssues,
      dataIdToUpdate: activeProject,
      viewId: moduleId,
    },
  };

  const { store: currentIssueStore, viewId, dataIdToUpdate } = issueStores[currentStore];

  const { setValue: setValueInLocalStorage, clearValue: clearLocalStorageValue } = useLocalStorage<any>(
    "draftedIssue",
    {}
  );

  const { setToastAlert } = useToast();

  useEffect(() => {
    setPreloadedData(prePopulateDataProps ?? {});

    if (cycleId && !prePopulateDataProps?.cycle_id) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle_id: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module_id) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module_id: moduleId.toString(),
      }));
    }
    if (
      (router.asPath.includes("my-issues") || router.asPath.includes("assigned")) &&
      !prePopulateDataProps?.assignee_ids
    ) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        assignees: prePopulateDataProps?.assignee_ids ?? [currentUser?.id ?? ""],
      }));
    }
  }, [prePopulateDataProps, cycleId, moduleId, router.asPath, currentUser?.id]);

  /**
   *
   * @description This function is used to close the modals. This function will show a confirm discard modal if the form is dirty.
   * @returns void
   */

  const onClose = () => {
    if (!showConfirmDiscard) handleClose();
    if (formDirtyState === null) return setActiveProject(null);
    const data = JSON.stringify(formDirtyState);
    setValueInLocalStorage(data);
  };

  /**
   * @description This function is used to close the modals. This function is to be used when the form is submitted,
   * meaning we don't need to show the confirm discard modal or store the form data in local storage.
   */

  const onFormSubmitClose = () => {
    setFormDirtyState(null);
    handleClose();
  };

  /**
   * @description This function is used to close the modals. This function is to be used when we click outside the modal,
   * meaning we don't need to show the confirm discard modal but will store the form data in local storage.
   * Use this function when you want to store the form data in local storage.
   */

  const onDiscardClose = () => {
    if (formDirtyState !== null && formDirtyState.name.trim() !== "") {
      setShowConfirmDiscard(true);
    } else {
      handleClose();
      setActiveProject(null);
    }
  };

  const handleFormDirty = (data: any) => {
    setFormDirtyState(data);
  };

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project_id) {
      setActiveProject(data.project_id);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (workspaceProjectIds && workspaceProjectIds.length > 0 && !activeProject)
      setActiveProject(projectId ?? workspaceProjectIds?.[0] ?? null);
  }, [data, projectId, workspaceProjectIds, isOpen, activeProject]);

  const addIssueToCycle = async (issue: TIssue, cycleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    await cycleIssues.addIssueToCycle(workspaceSlug, issue.project_id, cycleId, [issue.id]);
    fetchCycleDetails(workspaceSlug, activeProject, cycleId);
  };

  const addIssueToModule = async (issue: TIssue, moduleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    await moduleIssues.addIssueToModule(workspaceSlug, activeProject, moduleId, [issue.id]);
    fetchModuleDetails(workspaceSlug, activeProject, moduleId);
  };

  const createIssue = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !dataIdToUpdate) return;

    await currentIssueStore
      .createIssue(workspaceSlug, dataIdToUpdate, payload, viewId)
      .then(async (res) => {
        if (!res) throw new Error();

        if (handleSubmit) {
          await handleSubmit(res);
        } else {
          currentIssueStore.fetchIssues(workspaceSlug, dataIdToUpdate, "mutation", viewId);

          if (payload.cycle_id && payload.cycle_id !== "") await addIssueToCycle(res, payload.cycle_id);
          if (payload.module_id && payload.module_id !== "") await addIssueToModule(res, payload.module_id);

          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Issue created successfully.",
          });
          postHogEventTracker(
            "ISSUE_CREATED",
            {
              ...res,
              state: "SUCCESS",
            },
            {
              isGrouping: true,
              groupType: "Workspace_metrics",
              groupId: currentWorkspace?.id!,
            }
          );
          if (payload.parent_id && payload.parent_id !== "") mutate(SUB_ISSUES(payload.parent_id));
        }
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Issue could not be created. Please try again.",
        });
        postHogEventTracker(
          "ISSUE_CREATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      });

    if (!createMore) onFormSubmitClose();
  };

  const createDraftIssue = async () => {
    if (!workspaceSlug || !activeProject || !currentUser) return;

    const payload: Partial<TIssue> = {
      ...formDirtyState,
    };

    await issueDraftService
      .createDraftIssue(workspaceSlug as string, activeProject ?? "", payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Draft Issue created successfully.",
        });
        handleClose();
        setActiveProject(null);
        setFormDirtyState(null);
        setShowConfirmDiscard(false);

        if (payload.assignee_ids?.some((assignee) => assignee === currentUser?.id))
          mutate(USER_ISSUE(workspaceSlug as string));

        if (payload.parent_id && payload.parent_id !== "") mutate(SUB_ISSUES(payload.parent_id));
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Issue could not be created. Please try again.",
        });
      });
  };

  const updateIssue = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !dataIdToUpdate || !data) return;

    await currentIssueStore
      .updateIssue(workspaceSlug, dataIdToUpdate, data.id, payload, viewId)
      .then((res) => {
        if (!createMore) onFormSubmitClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue updated successfully.",
        });
        postHogEventTracker(
          "ISSUE_UPDATED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Issue could not be updated. Please try again.",
        });
        postHogEventTracker(
          "ISSUE_UPDATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            groupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleFormSubmit = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !dataIdToUpdate || !currentStore) return;

    const payload: Partial<TIssue> = {
      ...formData,
      description_html: formData.description_html ?? "<p></p>",
    };

    if (!data) await createIssue(payload);
    else await updateIssue(payload);

    if (onSubmit) await onSubmit(payload);
  };

  if (!workspaceProjectIds || workspaceProjectIds.length === 0) return null;

  return (
    <>
      <ConfirmIssueDiscard
        isOpen={showConfirmDiscard}
        handleClose={() => setShowConfirmDiscard(false)}
        onConfirm={createDraftIssue}
        onDiscard={() => {
          handleClose();
          setActiveProject(null);
          setFormDirtyState(null);
          setShowConfirmDiscard(false);
          clearLocalStorageValue();
        }}
      />

      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto">
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
                <Dialog.Panel className="relative mx-4 transform rounded-lg bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-4xl">
                  <IssueForm
                    handleFormSubmit={handleFormSubmit}
                    initialData={data ?? prePopulateData}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleDiscardClose={onDiscardClose}
                    projectId={activeProject ?? ""}
                    setActiveProject={setActiveProject}
                    status={data ? true : false}
                    fieldsToShow={fieldsToShow}
                    handleFormDirty={handleFormDirty}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
});
