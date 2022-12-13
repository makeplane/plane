import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
// swr
import { mutate } from "swr";
// react hook form
import { Controller, useForm } from "react-hook-form";
// fetching keys
import {
  PROJECT_ISSUES_DETAILS,
  PROJECT_ISSUES_LIST,
  CYCLE_ISSUES,
  USER_ISSUE,
} from "constants/fetch-keys";
// headless
import { Dialog, Menu, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// ui
import { Button, Input, TextArea } from "ui";
// commons
import { renderDateFormat, cosineSimilarity } from "constants/common";
// components
import SelectState from "./SelectState";
import SelectCycles from "./SelectCycles";
import SelectLabels from "./SelectLabels";
import SelectProject from "./SelectProject";
import SelectPriority from "./SelectPriority";
import SelectAssignee from "./SelectAssignee";
import SelectParent from "./SelectParentIssue";
import CreateUpdateStateModal from "components/project/issues/BoardView/state/CreateUpdateStateModal";
import CreateUpdateCycleModal from "components/project/cycles/CreateUpdateCyclesModal";
// types
import type { IIssue, IssueResponse, CycleIssueResponse } from "types";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

const RichTextEditor = dynamic(() => import("components/lexical/editor"), {
  ssr: false,
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
  // description: "",
  state: "",
  sprints: null,
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
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);

  const [mostSimilarIssue, setMostSimilarIssue] = useState<string | undefined>();

  // const [issueDescriptionValue, setIssueDescriptionValue] = useState("");
  // const handleDescriptionChange: any = (value: any) => {
  //   console.log(value);
  //   setIssueDescriptionValue(value);
  // };

  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    if (data) {
      resetForm();
    }
  };

  const { activeWorkspace, activeProject, user, issues } = useUser();

  const { setToastAlert } = useToast();

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setError,
    control,
    watch,
  } = useForm<IIssue>({
    defaultValues,
  });

  const resetForm = () => {
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const addIssueToSprint = async (issueId: string, sprintId: string, issueDetail: IIssue) => {
    if (!activeWorkspace || !activeProject) return;
    await issuesServices
      .addIssueToCycle(activeWorkspace.slug, activeProject.id, sprintId, {
        issue: issueId,
      })
      .then((res) => {
        mutate<CycleIssueResponse[]>(
          CYCLE_ISSUES(sprintId),
          (prevData) => {
            const targetResponse = prevData?.find((t) => t.cycle === sprintId);
            if (targetResponse) {
              targetResponse.issue_details = issueDetail;
              return prevData;
            } else {
              return [
                ...(prevData ?? []),
                {
                  cycle: sprintId,
                  issue_details: issueDetail,
                } as CycleIssueResponse,
              ];
            }
          },
          false
        );
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(
            PROJECT_ISSUES_DETAILS,
            (prevData) => ({ ...(prevData as IIssue), sprints: sprintId }),
            false
          );
        } else
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => {
              return {
                ...(prevData as IssueResponse),
                results: (prevData?.results ?? []).map((issue) => {
                  if (issue.id === res.id) return { ...issue, sprints: sprintId };
                  return issue;
                }),
              };
            },
            false
          );
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Issue added to cycle successfully",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const onSubmit = async (formData: IIssue) => {
    if (!activeWorkspace || !activeProject) return;
    const payload: Partial<IIssue> = {
      ...formData,
      target_date: formData.target_date ? renderDateFormat(formData.target_date ?? "") : null,
      // description: formData.description ? JSON.parse(formData.description) : null,
    };
    if (!data) {
      await issuesServices
        .createIssues(activeWorkspace.slug, activeProject.id, payload)
        .then(async (res) => {
          console.log(res);
          mutate<IssueResponse>(PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id));

          if (formData.sprints && formData.sprints !== null) {
            await addIssueToSprint(res.id, formData.sprints, formData);
          }
          handleClose();
          resetForm();
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
          Object.keys(err).map((key) => {
            setError(key as keyof IIssue, { message: err[key].join(", ") });
          });
        });
    } else {
      await issuesServices
        .updateIssue(activeWorkspace.slug, activeProject.id, data.id, payload)
        .then(async (res) => {
          console.log(res);
          if (isUpdatingSingleIssue) {
            mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
          } else
            mutate<IssueResponse>(
              PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
              (prevData) => {
                return {
                  ...(prevData as IssueResponse),
                  results: (prevData?.results ?? []).map((issue) => {
                    if (issue.id === res.id) return { ...issue, ...res };
                    return issue;
                  }),
                };
              },
              false
            );
          if (formData.sprints && formData.sprints !== null) {
            await addIssueToSprint(res.id, formData.sprints, formData);
          }
          handleClose();
          resetForm();
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

  useEffect(() => {
    if (data) setIsOpen(true);
  }, [data, setIsOpen]);

  useEffect(() => {
    reset({
      ...defaultValues,
      ...watch(),
      ...data,
      project: activeProject?.id ?? projectId,
      ...prePopulateData,
    });
  }, [data, prePopulateData, reset, projectId, activeProject, isOpen, watch]);

  useEffect(() => {
    return () => setMostSimilarIssue(undefined);
  }, []);

  // console.log(watch("parent"));

  return (
    <>
      {activeProject && (
        <>
          <CreateUpdateStateModal
            isOpen={isStateModalOpen}
            handleClose={() => setIsStateModalOpen(false)}
            projectId={activeProject?.id}
          />
          <CreateUpdateCycleModal
            isOpen={isCycleModalOpen}
            setIsOpen={setIsCycleModalOpen}
            projectId={activeProject?.id}
          />
        </>
      )}
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                <Dialog.Panel className="relative transform rounded-lg bg-white px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-5">
                      <div className="flex items-center gap-x-2">
                        <SelectProject control={control} />
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {data ? "Update" : "Create"} Issue
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div className="mt-2 space-y-3">
                          <div>
                            <TextArea
                              id="name"
                              label="Name"
                              name="name"
                              rows={1}
                              onChange={(e) => {
                                const value = e.target.value;
                                const similarIssue = issues?.results.find(
                                  (i) => cosineSimilarity(i.name, value) > 0.7
                                );
                                setMostSimilarIssue(similarIssue?.id);
                              }}
                              className="resize-none"
                              placeholder="Enter name"
                              autoComplete="off"
                              error={errors.name}
                              register={register}
                              validations={{
                                required: "Name is required",
                              }}
                            />
                            {mostSimilarIssue && (
                              <div className="flex items-center gap-x-2">
                                <p className="text-sm text-gray-500">
                                  Did you mean{" "}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMostSimilarIssue(undefined);
                                      router.push(
                                        `/projects/${activeProject?.id}/issues/${mostSimilarIssue}`
                                      );
                                      handleClose();
                                      resetForm();
                                    }}
                                  >
                                    <span className="italic">
                                      {
                                        issues?.results.find(
                                          (issue) => issue.id === mostSimilarIssue
                                        )?.name
                                      }
                                    </span>
                                  </button>
                                  ?
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
                            <TextArea
                              id="description"
                              name="description"
                              label="Description"
                              placeholder="Enter description"
                              error={errors.description}
                              register={register}
                            />
                            {/* <Controller
                              name="description"
                              control={control}
                              render={({ field }) => (
                                <RichTextEditor {...field} id="issueDescriptionEditor" />
                              )}
                            /> */}
                          </div>
                          <div>
                            {/* <Input
                              id="target_date"
                              label="Target Date"
                              name="target_date"
                              type="date"
                              placeholder="Enter name"
                              autoComplete="off"
                              error={errors.target_date}
                              register={register}
                            /> */}
                          </div>
                          <div className="flex items-center flex-wrap gap-2">
                            <SelectState control={control} setIsOpen={setIsStateModalOpen} />
                            <SelectCycles control={control} setIsOpen={setIsCycleModalOpen} />
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
                                  className="hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300"
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
                              <Menu.Button className="grid place-items-center p-1 hover:bg-gray-100 border rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm duration-300">
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
                                <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                  <div className="p-1">
                                    <Menu.Item as="div">
                                      <button
                                        type="button"
                                        className="p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap "
                                        onClick={() => setParentIssueListModalOpen(true)}
                                      >
                                        {watch("parent") && watch("parent") !== ""
                                          ? `${activeProject?.identifier}-${
                                              issues?.results.find((i) => i.id === watch("parent"))
                                                ?.sequence_id
                                            }`
                                          : "Select Parent Issue"}
                                      </button>
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
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
