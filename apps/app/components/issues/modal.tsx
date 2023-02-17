import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import projectService from "services/project.service";
import modulesService from "services/modules.service";
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// components
import { IssueForm } from "components/issues";
// types
import type { IIssue, IssueResponse } from "types";
// fetch keys
import {
  PROJECT_ISSUES_DETAILS,
  PROJECT_ISSUES_LIST,
  CYCLE_ISSUES,
  USER_ISSUE,
  PROJECTS_LIST,
  MODULE_ISSUES,
  SUB_ISSUES,
} from "constants/fetch-keys";

export interface IssuesModalProps {
  isOpen: boolean;
  handleClose: () => void;
  data?: IIssue | null;
  prePopulateData?: Partial<IIssue>;
  isUpdatingSingleIssue?: boolean;
}

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = ({
  isOpen,
  handleClose,
  data,
  prePopulateData,
  isUpdatingSingleIssue = false,
}) => {
  // states
  const [createMore, setCreateMore] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  if (cycleId) prePopulateData = { ...prePopulateData, cycle: cycleId as string };
  if (moduleId) prePopulateData = { ...prePopulateData, module: moduleId as string };

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const { data: issues } = useSWR(
    workspaceSlug && activeProject
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, activeProject ?? "")
      : null,
    workspaceSlug && activeProject
      ? () => issuesService.getIssues(workspaceSlug as string, activeProject ?? "")
      : null
  );

  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null
  );

  useEffect(() => {
    if (projects && projects.length > 0)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [projectId, projects]);

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId) return;

    await issuesService
      .addIssueToCycle(workspaceSlug as string, activeProject ?? "", cycleId, {
        issues: [issueId],
      })
      .then((res) => {
        mutate(CYCLE_ISSUES(cycleId));
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(
            PROJECT_ISSUES_DETAILS,
            (prevData) => ({ ...(prevData as IIssue), sprints: cycleId }),
            false
          );
        } else
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(workspaceSlug as string, activeProject ?? ""),
            (prevData) => ({
              ...(prevData as IssueResponse),
              results: (prevData?.results ?? []).map((issue) => {
                if (issue.id === res.id) return { ...issue, sprints: cycleId };
                return issue;
              }),
            }),
            false
          );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const addIssueToModule = async (issueId: string, moduleId: string) => {
    if (!workspaceSlug || !projectId) return;

    await modulesService
      .addIssuesToModule(workspaceSlug as string, activeProject ?? "", moduleId as string, {
        issues: [issueId],
      })
      .then((res) => {
        console.log(res);
        mutate(MODULE_ISSUES(moduleId as string));
      })
      .catch((e) => console.log(e));
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    await issuesService
      .createIssues(workspaceSlug as string, activeProject ?? "", payload)
      .then((res) => {
        mutate<IssueResponse>(PROJECT_ISSUES_LIST(workspaceSlug as string, activeProject ?? ""));

        if (payload.cycle && payload.cycle !== "") addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") addIssueToModule(res.id, payload.module);

        if (!createMore) handleClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.assignees_list?.some((assignee) => assignee === user?.id)) mutate(USER_ISSUE);

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
    await issuesService
      .updateIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(workspaceSlug as string, activeProject ?? ""),
            (prevData) => ({
              ...(prevData as IssueResponse),
              results: (prevData?.results ?? []).map((issue) => {
                if (issue.id === res.id) return { ...issue, ...res };
                return issue;
              }),
            })
          );
        }

        if (payload.cycle && payload.cycle !== "") addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") addIssueToModule(res.id, payload.module);

        if (!createMore) handleClose();

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
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={() => {}}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <IssueForm
                  issues={issues?.results ?? []}
                  handleFormSubmit={handleFormSubmit}
                  initialData={prePopulateData}
                  createMore={createMore}
                  setCreateMore={setCreateMore}
                  handleClose={handleClose}
                  projectId={activeProject ?? ""}
                  setActiveProject={setActiveProject}
                  status={data ? true : false}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
