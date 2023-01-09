import React, { useEffect, useState } from "react";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { Controller, useForm } from "react-hook-form";

import { Dialog, Menu, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// ui
import { Button, Input, Loader } from "ui";
// icons
import { EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
// components
import SelectState from "components/project/issues/create-update-issue-modal/select-state";
import SelectCycles from "components/project/issues/create-update-issue-modal/select-cycle";
import SelectLabels from "components/project/issues/create-update-issue-modal/select-labels";
import SelectProject from "components/project/issues/create-update-issue-modal/select-project";
import SelectPriority from "components/project/issues/create-update-issue-modal/select-priority";
import SelectAssignee from "components/project/issues/create-update-issue-modal/select-assignee";
import SelectParent from "components/project/issues/create-update-issue-modal/select-parent-issue";
import CreateUpdateStateModal from "components/project/issues/BoardView/state/create-update-state-modal";
import CreateUpdateCycleModal from "components/project/cycles/create-update-cycle-modal";
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
} from "constants/fetch-keys";
// common
import { renderDateFormat, cosineSimilarity } from "constants/common";
import projectService from "lib/services/project.service";
import modulesService from "lib/services/modules.service";

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="12rem" width="100%"></Loader.Item>
    </Loader>
  ),
});

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId?: string;
  data?: IIssue;
  prePopulateData?: Partial<IIssue>;
  isUpdatingSingleIssue?: boolean;
};

const defaultValues: Partial<IIssue> = {
  project: "",
  name: "",
  description: "",
  description_html: "<p></p>",
  state: "",
  cycle: null,
  priority: null,
  labels_list: [],
};

const CreateUpdateIssuesModal: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  data,
  projectId,
  prePopulateData,
  isUpdatingSingleIssue = false,
}) => {
  const [createMore, setCreateMore] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  const [mostSimilarIssue, setMostSimilarIssue] = useState<string | undefined>();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const { data: issues } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId)
      : null
  );

  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null
  );

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    setValue,
  } = useForm<IIssue>({
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (data) setIsOpen(true);
  }, [data, setIsOpen]);

  useEffect(() => {
    if (projects && projects.length > 0)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [projectId, projects]);

  useEffect(() => {
    reset({
      ...defaultValues,
      ...watch(),
      ...data,
      project: activeProject ?? "",
      ...prePopulateData,
    });
  }, [data, prePopulateData, reset, activeProject, isOpen, watch]);

  useEffect(() => {
    return () => setMostSimilarIssue(undefined);
  }, []);

  const resetForm = () => {
    reset({ ...defaultValues, project: activeProject ?? undefined });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (data) {
      resetForm();
    }
  };

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !projectId) return;

    await issuesServices
      .addIssueToCycle(workspaceSlug as string, projectId, cycleId, {
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
            PROJECT_ISSUES_LIST(workspaceSlug as string, projectId),
            (prevData) => {
              return {
                ...(prevData as IssueResponse),
                results: (prevData?.results ?? []).map((issue) => {
                  if (issue.id === res.id) return { ...issue, sprints: cycleId };
                  return issue;
                }),
              };
            },
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
      .addIssuesToModule(workspaceSlug as string, projectId, moduleId as string, {
        issues: [issueId],
      })
      .then((res) => {
        console.log(res);
        mutate(MODULE_ISSUES(moduleId as string));
      })
      .catch((e) => console.log(e));
  };

  const onSubmit = async (formData: IIssue) => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IIssue> = {
      ...formData,
      target_date: formData.target_date ? renderDateFormat(formData.target_date ?? "") : null,
    };

    if (!data) {
      await issuesServices
        .createIssues(workspaceSlug as string, projectId, payload)
        .then((res) => {
          mutate<IssueResponse>(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId));
          if (formData.cycle && formData.cycle !== null) {
            addIssueToCycle(res.id, formData.cycle);
          }

          if (formData.module && formData.module !== null) {
            addIssueToModule(res.id, formData.module);
          }

          resetForm();
          if (!createMore) handleClose();
          setToastAlert({
            title: "Success",
            type: "success",
            message: `Issue ${data ? "updated" : "created"} successfully`,
          });
          if (formData.assignees_list.some((assignee) => assignee === user?.id)) {
            mutate<IIssue[]>(USER_ISSUE);
          }
        })
        .catch((err) => {
          if (err.detail) {
            setToastAlert({
              title: "Join the project.",
              type: "error",
              message: "Click select to join from projects page to start making changes",
            });
          }
          Object.keys(err).map((key) => {
            const message = err[key];
            if (!message) return;

            setError(key as keyof IIssue, {
              message: Array.isArray(message) ? message.join(", ") : message,
            });
          });
        });
    } else {
      await issuesServices
        .updateIssue(workspaceSlug as string, projectId, data.id, payload)
        .then((res) => {
          if (isUpdatingSingleIssue) {
            mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
          } else
            mutate<IssueResponse>(
              PROJECT_ISSUES_LIST(workspaceSlug as string, projectId),
              (prevData) => {
                return {
                  ...(prevData as IssueResponse),
                  results: (prevData?.results ?? []).map((issue) => {
                    if (issue.id === res.id) return { ...issue, ...res };
                    return issue;
                  }),
                };
              }
            );
          if (formData.cycle && formData.cycle !== null) {
            addIssueToCycle(res.id, formData.cycle);
          }
          resetForm();
          if (!createMore) handleClose();
          setToastAlert({
            title: "Success",
            type: "success",
            message: "Issue updated successfully",
          });
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof IIssue, { message: err[key].join(", ") });
          });
        });
    }
  };

  return (
    <>
      {projectId && (
        <>
          <CreateUpdateStateModal
            isOpen={isStateModalOpen}
            handleClose={() => setIsStateModalOpen(false)}
            projectId={projectId}
          />
          <CreateUpdateCycleModal
            isOpen={isCycleModalOpen}
            setIsOpen={setIsCycleModalOpen}
            projectId={projectId}
          />
        </>
      )}
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-5">
                      <div className="flex items-center gap-x-2">
                        <SelectProject
                          control={control}
                          activeProject={activeProject ?? ""}
                          setActiveProject={setActiveProject}
                        />
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {data ? "Update" : "Create"} Issue
                        </h3>
                      </div>
                      {watch("parent") && watch("parent") !== "" ? (
                        <div className="flex w-min items-center gap-2 whitespace-nowrap rounded bg-gray-100 p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="block h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: issues?.results.find(
                                  (i) => i.id === watch("parent")
                                )?.state_detail.color,
                              }}
                            />
                            <span className="flex-shrink-0 text-gray-600">
                              {projects?.find((p) => p.id === activeProject)?.identifier}-
                              {issues?.results.find((i) => i.id === watch("parent"))?.sequence_id}
                            </span>
                            <span className="truncate font-medium">
                              {issues?.results
                                .find((i) => i.id === watch("parent"))
                                ?.name.substring(0, 50)}
                            </span>
                            <XMarkIcon
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => setValue("parent", null)}
                            />
                          </div>
                        </div>
                      ) : null}
                      <div className="space-y-3">
                        <div className="mt-2 space-y-3">
                          <div>
                            <Input
                              id="name"
                              label="Title"
                              name="name"
                              onChange={(e) => {
                                const value = e.target.value;
                                const similarIssue = issues?.results.find(
                                  (i) => cosineSimilarity(i.name, value) > 0.7
                                );
                                setMostSimilarIssue(similarIssue?.id);
                              }}
                              className="resize-none"
                              placeholder="Enter title"
                              autoComplete="off"
                              error={errors.name}
                              register={register}
                              validations={{
                                required: "Name is required",
                                maxLength: {
                                  value: 255,
                                  message: "Name should be less than 255 characters",
                                },
                              }}
                            />
                            {mostSimilarIssue && (
                              <div className="flex items-center gap-x-2">
                                <p className="text-sm text-gray-500">
                                  <Link
                                    href={`/${workspaceSlug}/projects/${projectId}/issues/${mostSimilarIssue}`}
                                  >
                                    <a target="_blank" type="button" className="inline text-left">
                                      <span>Did you mean </span>
                                      <span className="italic">
                                        {
                                          issues?.results.find((i) => i.id === mostSimilarIssue)
                                            ?.project_detail.identifier
                                        }
                                        -
                                        {
                                          issues?.results.find((i) => i.id === mostSimilarIssue)
                                            ?.sequence_id
                                        }
                                        :{" "}
                                        {
                                          issues?.results.find((i) => i.id === mostSimilarIssue)
                                            ?.name
                                        }{" "}
                                      </span>
                                      ?
                                    </a>
                                  </Link>{" "}
                                </p>
                                <button
                                  type="button"
                                  className="text-sm text-blue-500"
                                  onClick={() => {
                                    setMostSimilarIssue(undefined);
                                  }}
                                >
                                  No
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <label htmlFor={"description"} className="mb-2 text-gray-500">
                              Description
                            </label>
                            <Controller
                              name="description"
                              control={control}
                              render={({ field }) => (
                                <RemirrorRichTextEditor
                                  {...field}
                                  onBlur={(jsonValue, htmlValue) => {
                                    setValue("description", jsonValue);
                                    setValue("description_html", htmlValue);
                                  }}
                                  placeholder="Enter Your Text..."
                                />
                              )}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <SelectState control={control} setIsOpen={setIsStateModalOpen} />
                            <SelectCycles
                              control={control}
                              setIsOpen={setIsCycleModalOpen}
                              activeProject={activeProject ?? ""}
                            />
                            <SelectPriority control={control} />
                            <SelectAssignee control={control} />
                            <SelectLabels control={control} />
                            <Controller
                              control={control}
                              name="target_date"
                              render={({ field: { value, onChange } }) => (
                                <input
                                  type="date"
                                  value={value ?? ""}
                                  onChange={(e: any) => {
                                    onChange(e.target.value);
                                  }}
                                  className="cursor-pointer rounded-md border px-2 py-[3px] text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              )}
                            />
                            <SelectParent
                              control={control}
                              isOpen={parentIssueListModalOpen}
                              setIsOpen={setParentIssueListModalOpen}
                              issues={issues?.results ?? []}
                            />
                            <Menu as="div" className="relative inline-block">
                              <Menu.Button className="grid cursor-pointer place-items-center rounded-md border p-1 py-0.5 shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                                <EllipsisHorizontalIcon className="h-5 w-5" />
                              </Menu.Button>

                              <Transition
                                as={React.Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-0 z-50 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    {watch("parent") && watch("parent") !== "" ? (
                                      <>
                                        <Menu.Item as="div">
                                          <button
                                            type="button"
                                            className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                                            onClick={() => setParentIssueListModalOpen(true)}
                                          >
                                            Change parent issue
                                          </button>
                                        </Menu.Item>
                                        <Menu.Item as="div">
                                          <button
                                            type="button"
                                            className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                                            onClick={() => setValue("parent", null)}
                                          >
                                            Remove parent issue
                                          </button>
                                        </Menu.Item>
                                      </>
                                    ) : (
                                      <Menu.Item as="div">
                                        <button
                                          type="button"
                                          className="whitespace-nowrap p-2 text-left text-xs text-gray-900 hover:bg-indigo-50"
                                          onClick={() => setParentIssueListModalOpen(true)}
                                        >
                                          Select Parent Issue
                                        </button>
                                      </Menu.Item>
                                    )}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-2">
                      <div
                        className="flex cursor-pointer items-center gap-1"
                        onClick={() => setCreateMore((prevData) => !prevData)}
                      >
                        <span className="text-xs">Create more</span>
                        <button
                          type="button"
                          className={`pointer-events-none relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
                            createMore ? "bg-theme" : "bg-gray-300"
                          } transition-colors duration-300 ease-in-out focus:outline-none`}
                          role="switch"
                          aria-checked="false"
                        >
                          <span className="sr-only">Create more</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-3 w-3 ${
                              createMore ? "translate-x-3" : "translate-x-0"
                            } transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out`}
                          ></span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          theme="secondary"
                          onClick={() => {
                            handleClose();
                            resetForm();
                          }}
                        >
                          Discard
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {data
                            ? isSubmitting
                              ? "Updating Issue..."
                              : "Update Issue"
                            : isSubmitting
                            ? "Creating Issue..."
                            : "Create Issue"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default CreateUpdateIssuesModal;
