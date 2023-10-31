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
  )[];
  onSubmit?: (data: Partial<IIssue>) => Promise<void>;
}

const issueDraftService = new IssueDraftService();

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const { data, handleClose, isOpen, prePopulateData: prePopulateDataProps, fieldsToShow = ["all"], onSubmit } = props;

  // states
  const [createMore, setCreateMore] = useState(false);
  const [formDirtyState, setFormDirtyState] = useState<any>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue>>({});

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const {
    project: projectStore,
    issue: issueStore,
    issueDetail: issueDetailStore,
    cycleIssue: cycleIssueStore,
    moduleIssue: moduleIssueStore,
    user: userStore,
  } = useMobxStore();

  const user = userStore.currentUser;

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
  }, [activeProject, data, projectId, projects, isOpen]);

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    cycleIssueStore.addIssueToCycle(workspaceSlug.toString(), activeProject, cycleId, issueId);
  };

  const addIssueToModule = async (issueId: string, moduleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    moduleIssueStore.addIssueToModule(workspaceSlug.toString(), activeProject, moduleId, issueId);
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;

    await issueDetailStore
      .createIssue(workspaceSlug.toString(), activeProject, payload)
      .then(async (res) => {
        issueStore.fetchIssues(workspaceSlug.toString(), activeProject);

        if (payload.cycle && payload.cycle !== "") await addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") await addIssueToModule(res.id, payload.module);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
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
    if (!workspaceSlug || !activeProject || !data) return;

    await issueDetailStore
      .updateIssue(workspaceSlug.toString(), activeProject, data.id, payload)
      .then(() => {
        if (!createMore) onFormSubmitClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;

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
                <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-3xl">
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
