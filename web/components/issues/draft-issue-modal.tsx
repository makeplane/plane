import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// components
import { DraftIssueForm } from "components/issues";
// types
import type { IIssue } from "types";
// fetch-keys
import { PROJECT_ISSUES_DETAILS, USER_ISSUE, SUB_ISSUES } from "constants/fetch-keys";

interface IssuesModalProps {
  data?: IIssue | null;
  handleClose: () => void;
  isOpen: boolean;
  isUpdatingSingleIssue?: boolean;
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
  onSubmit?: (data: Partial<IIssue>) => Promise<void> | void;
}

// services
const issueService = new IssueService();
const moduleService = new ModuleService();

export const CreateUpdateDraftIssueModal: React.FC<IssuesModalProps> = observer((props) => {
  const {
    data,
    handleClose,
    isOpen,
    isUpdatingSingleIssue = false,
    prePopulateData: prePopulateDataProps,
    fieldsToShow = ["all"],
    onSubmit,
  } = props;

  // states
  const [createMore, setCreateMore] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue> | undefined>(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { project: projectStore, user: userStore, projectDraftIssues: draftIssueStore } = useMobxStore();

  const user = userStore.currentUser;
  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const { clearValue: clearDraftIssueLocalStorage } = useLocalStorage("draftedIssue", {});

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
    setActiveProject(null);
  };

  const onDiscard = () => {
    clearDraftIssueLocalStorage();
    onClose();
  };

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

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project) return setActiveProject(data.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, data, projectId, projects, isOpen, prePopulateData]);

  const createDraftIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await draftIssueStore
      .createIssue(workspaceSlug as string, activeProject ?? "", payload)
      .then(async () => {
        await draftIssueStore.fetchIssues(workspaceSlug as string, activeProject ?? "", "mutation");
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.assignees?.some((assignee) => assignee === user?.id)) mutate(USER_ISSUE(workspaceSlug.toString()));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });

    if (!createMore) onClose();
  };

  const updateDraftIssue = async (payload: Partial<IIssue>) => {
    if (!user) return;

    await draftIssueStore
      .updateIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          if (payload.parent) mutate(SUB_ISSUES(payload.parent.toString()));
        }

        if (!payload.is_draft) {
          if (payload.cycle && payload.cycle !== "") addIssueToCycle(res.id, payload.cycle);
          if (payload.module && payload.module !== "") addIssueToModule(res.id, payload.module);
        }

        if (!createMore) onClose();

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

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issueService.addIssueToCycle(workspaceSlug as string, activeProject ?? "", cycleId, {
      issues: [issueId],
    });
  };

  const addIssueToModule = async (issueId: string, moduleId: string) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await moduleService.addIssuesToModule(workspaceSlug as string, activeProject ?? "", moduleId as string, {
      issues: [issueId],
    });
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issueService
      .createIssue(workspaceSlug.toString(), activeProject, payload)
      .then(async (res) => {
        if (payload.cycle && payload.cycle !== "") await addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") await addIssueToModule(res.id, payload.module);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (!createMore) onClose();

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

  const handleFormSubmit = async (
    formData: Partial<IIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    if (!workspaceSlug || !activeProject) return;

    const payload: Partial<IIssue> = {
      ...formData,
      description: formData.description ?? "",
      description_html: formData.description_html ?? "<p></p>",
    };

    if (action === "createDraft") await createDraftIssue(payload);
    else if (action === "updateDraft" || action === "convertToNewIssue") await updateDraftIssue(payload);
    else if (action === "createNewIssue") await createIssue(payload);

    clearDraftIssueLocalStorage();

    if (onSubmit) await onSubmit(payload);
  };

  if (!projects || projects.length === 0) return null;

  return (
    <>
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
                <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                  <DraftIssueForm
                    isOpen={isOpen}
                    handleFormSubmit={handleFormSubmit}
                    prePopulatedData={prePopulateData}
                    data={data}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleClose={onClose}
                    handleDiscard={onDiscard}
                    projectId={activeProject ?? ""}
                    setActiveProject={setActiveProject}
                    status={data ? true : false}
                    user={user ?? undefined}
                    fieldsToShow={fieldsToShow}
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
