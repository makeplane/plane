import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// services
import { IssueService } from "services/issue";
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
import { useIssues, useProject, useUser } from "hooks/store";
// components
import { DraftIssueForm } from "components/issues";
// types
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "constants/issue";
// fetch-keys
import { PROJECT_ISSUES_DETAILS, USER_ISSUE, SUB_ISSUES } from "constants/fetch-keys";

interface IssuesModalProps {
  data?: TIssue | null;
  handleClose: () => void;
  isOpen: boolean;
  isUpdatingSingleIssue?: boolean;
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
  )[];
  onSubmit?: (data: Partial<TIssue>) => Promise<void> | void;
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
  const [prePopulateData, setPreloadedData] = useState<Partial<TIssue> | undefined>(undefined);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;
  // store
  const { issues: draftIssues } = useIssues(EIssuesStoreType.DRAFT);
  const { currentUser } = useUser();
  const { workspaceProjectIds: workspaceProjects } = useProject();
  // derived values
  const projects = workspaceProjects;

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

    if (cycleId && !prePopulateDataProps?.cycle_id) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module_ids) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module: moduleId.toString(),
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

  useEffect(() => {
    setPreloadedData(prePopulateDataProps ?? {});

    if (cycleId && !prePopulateDataProps?.cycle_id) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module_ids) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module: moduleId.toString(),
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

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project_id) return setActiveProject(data.project_id);

    if (prePopulateData && prePopulateData.project_id && !activeProject)
      return setActiveProject(prePopulateData.project_id);

    if (prePopulateData && prePopulateData.project_id && !activeProject)
      return setActiveProject(prePopulateData.project_id);

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((id) => id === projectId) ?? projects?.[0] ?? null);
  }, [activeProject, data, projectId, projects, isOpen, prePopulateData]);

  const createDraftIssue = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !activeProject || !currentUser) return;

    await draftIssues
      .createIssue(workspaceSlug as string, activeProject ?? "", payload)
      .then(async () => {
        await draftIssues.fetchIssues(workspaceSlug as string, activeProject ?? "", "mutation");
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.assignee_ids?.some((assignee) => assignee === currentUser?.id))
          mutate(USER_ISSUE(workspaceSlug.toString()));
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

  const updateDraftIssue = async (payload: Partial<TIssue>) => {
    await draftIssues
      .updateIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<TIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          if (payload.parent_id) mutate(SUB_ISSUES(payload.parent_id.toString()));
        }

        // if (!payload.is_draft) { // TODO: check_with_backend
        //   if (payload.cycle_id && payload.cycle_id !== "") addIssueToCycle(res.id, payload.cycle_id);
        //   if (payload.module_id && payload.module_id !== "") addIssueToModule(res.id, payload.module_id);
        // }

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
    if (!workspaceSlug || !activeProject) return;

    await issueService.addIssueToCycle(workspaceSlug as string, activeProject ?? "", cycleId, {
      issues: [issueId],
    });
  };

  const addIssueToModule = async (issueId: string, moduleIds: string[]) => {
    if (!workspaceSlug || !activeProject) return;

    await moduleService.addModulesToIssue(workspaceSlug as string, activeProject ?? "", issueId as string, {
      modules: moduleIds,
    });
  };

  const createIssue = async (payload: Partial<TIssue>) => {
    if (!workspaceSlug || !activeProject) return;

    await issueService
      .createIssue(workspaceSlug.toString(), activeProject, payload)
      .then(async (res) => {
        if (payload.cycle_id && payload.cycle_id !== "") await addIssueToCycle(res.id, payload.cycle_id);
        if (payload.module_ids && payload.module_ids.length > 0) await addIssueToModule(res.id, payload.module_ids);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (!createMore) onClose();

        if (payload.assignee_ids?.some((assignee) => assignee === currentUser?.id))
          mutate(USER_ISSUE(workspaceSlug as string));

        if (payload.parent_id && payload.parent_id !== "") mutate(SUB_ISSUES(payload.parent_id));
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
    formData: Partial<TIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    if (!workspaceSlug || !activeProject) return;

    const payload: Partial<TIssue> = {
      ...formData,
      // description: formData.description ?? "",
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
                <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-4xl">
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
                    user={currentUser ?? undefined}
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
