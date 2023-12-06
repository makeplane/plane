import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueDraftService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { IssueForm, ConfirmIssueDiscard } from "components/issues";
// types
import type { IIssue } from "types";
// fetch-keys
import { USER_ISSUE, SUB_ISSUES } from "constants/fetch-keys";
import { EProjectStore } from "store/command-palette.store";

export interface IssuesModalProps {
  data?: IIssue | null;
  handleClose: () => void;
  isOpen: boolean;
  prePopulateData?: Partial<IIssue>;
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
  onSubmit?: (data: Partial<IIssue>) => Promise<void>;
  handleSubmit?: (data: Partial<IIssue>) => Promise<void>;
  currentStore?: EProjectStore;
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
    currentStore = EProjectStore.PROJECT,
  } = props;

  // states
  const [createMore, setCreateMore] = useState(false);
  const [formDirtyState, setFormDirtyState] = useState<any>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue>>({});

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query as {
    workspaceSlug: string;
    projectId: string | undefined;
    cycleId: string | undefined;
    moduleId: string | undefined;
  };

  const {
    project: projectStore,
    projectIssues: projectIssueStore,
    viewIssues: projectViewIssueStore,
    workspaceProfileIssues: profileIssueStore,
    cycleIssues: cycleIssueStore,
    moduleIssues: moduleIssueStore,
    user: userStore,
    trackEvent: { postHogEventTracker },
    workspace: { currentWorkspace },
  } = useMobxStore();

  const user = userStore.currentUser;

  const issueStores = {
    [EProjectStore.PROJECT]: {
      store: projectIssueStore,
      dataIdToUpdate: activeProject,
      viewId: undefined,
    },
    [EProjectStore.PROJECT_VIEW]: {
      store: projectViewIssueStore,
      dataIdToUpdate: activeProject,
      viewId: undefined,
    },
    [EProjectStore.PROFILE]: {
      store: profileIssueStore,
      dataIdToUpdate: user?.id || undefined,
      viewId: undefined,
    },
    [EProjectStore.CYCLE]: {
      store: cycleIssueStore,
      dataIdToUpdate: activeProject,
      viewId: cycleId,
    },
    [EProjectStore.MODULE]: {
      store: moduleIssueStore,
      dataIdToUpdate: activeProject,
      viewId: moduleId,
    },
  };

  const { store: currentIssueStore, viewId, dataIdToUpdate } = issueStores[currentStore];

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const { setValue: setValueInLocalStorage, clearValue: clearLocalStorageValue } = useLocalStorage<any>(
    "draftedIssue",
    {}
  );

  const { setToastAlert } = useToast();

  useEffect(() => {
    setPreloadedData(prePopulateDataProps ?? {});

    if (cycleId && !prePopulateDataProps?.cycle) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module: moduleId.toString(),
      }));
    }
    if (
      (router.asPath.includes("my-issues") || router.asPath.includes("assigned")) &&
      !prePopulateDataProps?.assignees
    ) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        assignees: prePopulateDataProps?.assignees ?? [user?.id ?? ""],
      }));
    }
  }, [prePopulateDataProps, cycleId, moduleId, router.asPath, user?.id]);

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
    if (formDirtyState !== null) {
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
    if (data && data.project) {
      setActiveProject(data.project);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [data, projectId, projects, isOpen, activeProject]);

  const addIssueToCycle = async (issue: IIssue, cycleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    cycleIssueStore.addIssueToCycle(workspaceSlug, cycleId, [issue.id]);
  };

  const addIssueToModule = async (issue: IIssue, moduleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    moduleIssueStore.addIssueToModule(workspaceSlug, moduleId, [issue.id]);
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !dataIdToUpdate) return;

    await currentIssueStore
      .createIssue(workspaceSlug, dataIdToUpdate, payload, viewId)
      .then(async (res) => {
        if (!res) throw new Error();

        if (handleSubmit) {
          await handleSubmit(res);
        } else {
          currentIssueStore.fetchIssues(workspaceSlug, dataIdToUpdate, "mutation", viewId);

          if (payload.cycle && payload.cycle !== "") await addIssueToCycle(res, payload.cycle);
          if (payload.module && payload.module !== "") await addIssueToModule(res, payload.module);

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
              gorupId: currentWorkspace?.id!,
            }
          );
          if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));
        }
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
        postHogEventTracker(
          "ISSUE_CREATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      });

    if (!createMore) onFormSubmitClose();
  };

  const createDraftIssue = async () => {
    if (!workspaceSlug || !activeProject || !user) return;

    const payload: Partial<IIssue> = {
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

        if (payload.assignees?.some((assignee) => assignee === user?.id)) mutate(USER_ISSUE(workspaceSlug as string));

        if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });
  };

  const updateIssue = async (payload: Partial<IIssue>) => {
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
            gorupId: currentWorkspace?.id!,
          }
        );
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be updated. Please try again.",
        });
        postHogEventTracker(
          "ISSUE_UPDATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const handleFormSubmit = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !dataIdToUpdate || !currentStore) return;

    const payload: Partial<IIssue> = {
      ...formData,
      description: formData.description ?? "",
      description_html: formData.description_html ?? "<p></p>",
    };

    if (!data) await createIssue(payload);
    else await updateIssue(payload);

    if (onSubmit) await onSubmit(payload);
  };

  if (!projects || projects.length === 0) return null;

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
                <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full mx-4 sm:max-w-4xl">
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
