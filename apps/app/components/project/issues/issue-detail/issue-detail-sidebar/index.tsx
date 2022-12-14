import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

import { useForm, Controller, UseFormWatch } from "react-hook-form";

import { TwitterPicker } from "react-color";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useToast from "lib/hooks/useToast";
// components
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import SelectState from "components/project/issues/issue-detail/issue-detail-sidebar/select-state";
import SelectPriority from "components/project/issues/issue-detail/issue-detail-sidebar/select-priority";
import SelectParent from "components/project/issues/issue-detail/issue-detail-sidebar/select-parent";
import SelectCycle from "components/project/issues/issue-detail/issue-detail-sidebar/select-cycle";
import SelectAssignee from "components/project/issues/issue-detail/issue-detail-sidebar/select-assignee";
import SelectBlocker from "components/project/issues/issue-detail/issue-detail-sidebar/select-blocker";
import SelectBlocked from "components/project/issues/issue-detail/issue-detail-sidebar/select-blocked";
// headless ui
import { Popover, Listbox, Transition } from "@headlessui/react";
// ui
import { Input, Button, Spinner } from "ui";
// icons
import {
  TagIcon,
  ChevronDownIcon,
  LinkIcon,
  CalendarDaysIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import type { Control } from "react-hook-form";
import type { ICycle, IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// common
import { copyTextToClipboard } from "constants/common";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  issueDetail: IIssue | undefined;
  watch: UseFormWatch<IIssue>;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  colour: "#ff0000",
};

const IssueDetailSidebar: React.FC<Props> = ({
  control,
  submitChanges,
  issueDetail,
  watch: watchIssue,
}) => {
  const [createLabelForm, setCreateLabelForm] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels, mutate: issueLabelMutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
    control: controlLabel,
  } = useForm({
    defaultValues,
  });

  const handleNewLabel = (formData: any) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;
    issuesServices
      .createIssueLabel(workspaceSlug as string, projectId as string, formData)
      .then((res) => {
        reset(defaultValues);
        issueLabelMutate((prevData) => [...(prevData ?? []), res], false);
        submitChanges({ labels_list: [...(issueDetail?.labels ?? []), res.id] });
        setCreateLabelForm(false);
      });
  };

  const handleCycleChange = (cycleDetail: ICycle) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));

    issuesServices.addIssueToCycle(workspaceSlug as string, projectId as string, cycleDetail.id, {
      issues: [issueDetail.id],
    });
  };

  return (
    <>
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssueModal(false)}
        isOpen={deleteIssueModal}
        data={issueDetail}
      />
      <div className="h-full w-full divide-y-2 divide-gray-100">
        <div className="flex items-center justify-between pb-3">
          <h4 className="text-sm font-medium">
            {issueDetail?.project_detail?.identifier}-{issueDetail?.sequence_id}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md border p-2 shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onClick={() =>
                copyTextToClipboard(
                  `https://app.plane.so/${workspaceSlug}/projects/${issueDetail?.project_detail?.id}/issues/${issueDetail?.id}`
                )
                  .then(() => {
                    setToastAlert({
                      type: "success",
                      title: "Issue link copied to clipboard",
                    });
                  })
                  .catch(() => {
                    setToastAlert({
                      type: "error",
                      title: "Some error occurred",
                    });
                  })
              }
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded-md border border-red-500 p-2 text-red-500 shadow-sm duration-300 hover:bg-red-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onClick={() => setDeleteIssueModal(true)}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="divide-y-2 divide-gray-100">
          <div className="py-1">
            <SelectState control={control} submitChanges={submitChanges} />
            <SelectAssignee control={control} submitChanges={submitChanges} />
            <SelectPriority control={control} submitChanges={submitChanges} watch={watchIssue} />
          </div>
          <div className="py-1">
            <SelectParent
              control={control}
              submitChanges={submitChanges}
              issuesList={
                issues?.results.filter(
                  (i) =>
                    i.id !== issueDetail?.id &&
                    i.id !== issueDetail?.parent &&
                    i.parent !== issueDetail?.id
                ) ?? []
              }
              customDisplay={
                issueDetail?.parent_detail ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-xs"
                    onClick={() => submitChanges({ parent: null })}
                  >
                    {issueDetail.parent_detail?.name}
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="inline-block rounded bg-gray-100 px-3 py-2 text-xs">
                    No parent selected
                  </div>
                )
              }
              watch={watchIssue}
            />
            <SelectBlocker
              submitChanges={submitChanges}
              issuesList={issues?.results.filter((i) => i.id !== issueDetail?.id) ?? []}
              watch={watchIssue}
            />
            <SelectBlocked
              submitChanges={submitChanges}
              issuesList={issues?.results.filter((i) => i.id !== issueDetail?.id) ?? []}
              watch={watchIssue}
            />
            <div className="flex flex-wrap items-center py-2">
              <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                <CalendarDaysIcon className="h-4 w-4 flex-shrink-0" />
                <p>Due date</p>
              </div>
              <div className="sm:basis-1/2">
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="date"
                      id="issueDate"
                      value={value ?? ""}
                      onChange={(e: any) => {
                        submitChanges({ target_date: e.target.value });
                        onChange(e.target.value);
                      }}
                      className="w-full cursor-pointer rounded-md border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="py-1">
            <SelectCycle
              issueDetail={issueDetail}
              control={control}
              handleCycleChange={handleCycleChange}
              watch={watchIssue}
            />
          </div>
        </div>
        <div className="space-y-3 pt-3">
          <div className="flex items-start justify-between">
            <div className="flex basis-1/2 items-center gap-x-2 text-sm">
              <TagIcon className="h-4 w-4" />
              <p>Label</p>
            </div>
            <div className="basis-1/2">
              <div className="flex flex-wrap gap-1">
                {watchIssue("labels_list")?.map((label) => {
                  const singleLabel = issueLabels?.find((l) => l.id === label);

                  if (!singleLabel) return null;

                  return (
                    <span
                      key={singleLabel.id}
                      className="group flex cursor-pointer items-center gap-1 rounded-2xl border px-1 py-0.5 text-xs hover:border-red-500 hover:bg-red-50"
                      onClick={() => {
                        const updatedLabels = watchIssue("labels_list")?.filter((l) => l !== label);
                        submitChanges({
                          labels_list: updatedLabels,
                        });
                      }}
                    >
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: singleLabel.colour ?? "green" }}
                      ></span>
                      {singleLabel.name}
                      <XMarkIcon className="h-2 w-2 group-hover:text-red-500" />
                    </span>
                  );
                })}
                <Controller
                  control={control}
                  name="labels_list"
                  render={({ field: { value } }) => (
                    <Listbox
                      as="div"
                      value={value}
                      onChange={(val: any) => submitChanges({ labels_list: val })}
                      className="flex-shrink-0"
                      multiple
                    >
                      {({ open }) => (
                        <>
                          <Listbox.Label className="sr-only">Label</Listbox.Label>
                          <div className="relative">
                            <Listbox.Button className="flex cursor-pointer items-center gap-2 rounded-2xl border px-2 py-0.5 text-xs hover:bg-gray-100">
                              Select Label
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-28 w-40 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  {issueLabels ? (
                                    issueLabels.length > 0 ? (
                                      issueLabels.map((label: IIssueLabels) => (
                                        <Listbox.Option
                                          key={label.id}
                                          className={({ active, selected }) =>
                                            `${
                                              active || selected ? "bg-indigo-50" : ""
                                            } relative flex cursor-pointer select-none items-center gap-2 truncate p-2 text-gray-900`
                                          }
                                          value={label.id}
                                        >
                                          <span
                                            className="h-2 w-2 flex-shrink-0 rounded-full"
                                            style={{ backgroundColor: label.colour ?? "green" }}
                                          ></span>
                                          {label.name}
                                        </Listbox.Option>
                                      ))
                                    ) : (
                                      <div className="text-center">No labels found</div>
                                    )
                                  ) : (
                                    <Spinner />
                                  )}
                                </div>
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </>
                      )}
                    </Listbox>
                  )}
                />
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1 rounded-2xl border px-2 py-0.5 text-xs hover:bg-gray-100"
                  onClick={() => setCreateLabelForm((prevData) => !prevData)}
                >
                  {createLabelForm ? (
                    <>
                      <XMarkIcon className="h-3 w-3" /> Cancel
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-3 w-3" /> New
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          {createLabelForm && (
            <form className="flex items-center gap-x-2" onSubmit={handleSubmit(handleNewLabel)}>
              <div>
                <Popover className="relative">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        className={`flex items-center gap-1 rounded-md bg-white p-1 outline-none focus:ring-2 focus:ring-indigo-500`}
                      >
                        {watch("colour") && watch("colour") !== "" && (
                          <span
                            className="h-5 w-5 rounded"
                            style={{
                              backgroundColor: watch("colour") ?? "green",
                            }}
                          ></span>
                        )}
                        <ChevronDownIcon className="h-3 w-3" />
                      </Popover.Button>

                      <Transition
                        as={React.Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <Popover.Panel className="absolute right-0 bottom-8 z-10 mt-1 max-w-xs transform px-2 sm:px-0">
                          <Controller
                            name="colour"
                            control={controlLabel}
                            render={({ field: { value, onChange } }) => (
                              <TwitterPicker
                                color={value}
                                onChange={(value) => onChange(value.hex)}
                              />
                            )}
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              </div>
              <Input
                id="name"
                name="name"
                placeholder="Title"
                register={register}
                validations={{
                  required: "This is required",
                }}
                autoComplete="off"
              />
              <Button type="submit" theme="danger" onClick={() => setCreateLabelForm(false)}>
                <XMarkIcon className="h-4 w-4 text-white" />
              </Button>
              <Button type="submit" theme="success" disabled={isSubmitting}>
                <PlusIcon className="h-4 w-4 text-white" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default IssueDetailSidebar;
