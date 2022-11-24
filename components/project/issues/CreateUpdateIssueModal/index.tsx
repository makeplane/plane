import React, { useEffect, useState } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm } from "react-hook-form";
// fetching keys
import { PROJECT_ISSUES_DETAILS, PROJECT_ISSUES_LIST, CYCLE_ISSUES } from "constants/fetch-keys";
// headless
import { Dialog, Transition } from "@headlessui/react";
// services
import issuesServices from "lib/services/issues.services";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// ui
import { Button, Input, TextArea } from "ui";
// commons
import { renderDateFormat } from "constants/common";
// components
import SelectState from "./SelectState";
import SelectCycles from "./SelectCycles";
import SelectLabels from "./SelectLabels";
import SelectProject from "./SelectProject";
import SelectPriority from "./SelectPriority";
import SelectAssignee from "./SelectAssignee";
import SelectParent from "./SelectParentIssues";
import CreateUpdateStateModal from "components/project/issues/BoardView/state/CreateUpdateStateModal";
import CreateUpdateCycleModal from "components/project/cycles/CreateUpdateCyclesModal";

// types
import type { IIssue, IssueResponse, SprintIssueResponse } from "types";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectId?: string;
  data?: IIssue;
  prePopulateData?: Partial<IIssue>;
  isUpdatingSingleIssue?: boolean;
};

const defaultValues: Partial<IIssue> = {
  name: "",
  description: "",
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

  const handleClose = () => {
    setIsOpen(false);
    if (data) {
      resetForm();
    }
  };

  const resetForm = () => {
    const timeout = setTimeout(() => {
      reset(defaultValues);
      clearTimeout(timeout);
    }, 500);
  };

  const { activeWorkspace, activeProject } = useUser();

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

  const addIssueToSprint = async (issueId: string, sprintId: string, issueDetail: IIssue) => {
    if (!activeWorkspace || !activeProject) return;
    await issuesServices
      .addIssueToSprint(activeWorkspace.slug, activeProject.id, sprintId, {
        issue: issueId,
      })
      .then((res) => {
        console.log("add to sprint", res);
        mutate<SprintIssueResponse[]>(
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
                } as SprintIssueResponse,
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
    };
    if (!data) {
      await issuesServices
        .createIssues(activeWorkspace.slug, activeProject.id, payload)
        .then(async (res) => {
          console.log(res);
          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
            (prevData) => {
              return {
                ...(prevData as IssueResponse),
                results: [res, ...(prevData?.results ?? [])],
                count: (prevData?.count ?? 0) + 1,
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
            message: `Issue ${data ? "updated" : "created"} successfully`,
          });
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

  return (
    <>
      {activeProject && (
        <>
          <CreateUpdateStateModal
            isOpen={isStateModalOpen}
            setIsOpen={setIsStateModalOpen}
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
                              className="resize-none"
                              placeholder="Enter name"
                              autoComplete="off"
                              error={errors.name}
                              register={register}
                              validations={{
                                required: "Name is required",
                              }}
                            />
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
                          </div>
                          <div>
                            <Input
                              id="target_date"
                              label="Due Date"
                              name="target_date"
                              type="date"
                              placeholder="Enter name"
                              autoComplete="off"
                              error={errors.target_date}
                              register={register}
                            />
                          </div>
                          <div className="flex items-center flex-wrap gap-2">
                            <SelectState control={control} setIsOpen={setIsStateModalOpen} />
                            <SelectCycles control={control} setIsOpen={setIsCycleModalOpen} />
                            <SelectPriority control={control} />
                            <SelectLabels control={control} />
                            <SelectAssignee control={control} />
                            <SelectParent control={control} />
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
