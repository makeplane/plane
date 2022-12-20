import React, { useState } from "react";
// swr
import useSWR from "swr";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// react hook form
import { useForm, Controller, UseFormWatch } from "react-hook-form";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// fetching keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
// commons
import { copyTextToClipboard } from "constants/common";
// ui
import { Input, Button, Spinner } from "ui";
import { Popover } from "@headlessui/react";
// icons
import {
  TagIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  CalendarDaysIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import type { Control } from "react-hook-form";
import type { IIssue, IIssueLabels, NestedKeyOf } from "types";
import { TwitterPicker } from "react-color";
import { positionEditorElement } from "components/lexical/helpers/editor";
import SelectState from "./select-state";
import SelectPriority from "./select-priority";
import SelectParent from "./select-parent";
import SelectCycle from "./select-cycle";
import SelectAssignee from "./select-assignee";
import SelectBlocker from "./select-blocker";
import SelectBlocked from "./select-blocked";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  issueDetail: IIssue | undefined;
  watch: UseFormWatch<IIssue>;
  setDeleteIssueModal: React.Dispatch<React.SetStateAction<boolean>>;
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
  setDeleteIssueModal,
}) => {
  const [createLabelForm, setCreateLabelForm] = useState(false);

  const { activeWorkspace, activeProject, issues } = useUser();

  const { setToastAlert } = useToast();

  const { data: issueLabels, mutate: issueLabelMutate } = useSWR<IIssueLabels[]>(
    activeProject && activeWorkspace ? PROJECT_ISSUE_LABELS(activeProject.id) : null,
    activeProject && activeWorkspace
      ? () => issuesServices.getIssueLabels(activeWorkspace.slug, activeProject.id)
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
    if (!activeWorkspace || !activeProject || isSubmitting) return;
    issuesServices
      .createIssueLabel(activeWorkspace.slug, activeProject.id, formData)
      .then((res) => {
        console.log(res);
        reset(defaultValues);
        issueLabelMutate((prevData) => [...(prevData ?? []), res], false);
        submitChanges({ labels_list: [res.id] });
      });
  };

  const handleCycleChange = (cycleId: string) => {
    if (activeWorkspace && activeProject && issueDetail)
      issuesServices
        .addIssueToCycle(activeWorkspace.slug, activeProject.id, cycleId, {
          issue: issueDetail.id,
        })
        .then(() => {
          submitChanges({});
        });
  };

  return (
    <>
      <div className="h-full w-full divide-y-2 divide-gray-100">
        <div className="flex justify-between items-center pb-3">
          <h4 className="text-sm font-medium">
            {activeProject?.identifier}-{issueDetail?.sequence_id}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
              onClick={() =>
                copyTextToClipboard(
                  `https://app.plane.so/projects/${activeProject?.id}/issues/${issueDetail?.id}`
                )
                  .then(() => {
                    setToastAlert({
                      type: "success",
                      title: "Copied to clipboard",
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
              className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
              onClick={() =>
                copyTextToClipboard(issueDetail?.id ?? "")
                  .then(() => {
                    setToastAlert({
                      type: "success",
                      title: "Copied to clipboard",
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
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-red-50 text-red-500 border border-red-500 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
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
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 text-xs rounded"
                    onClick={() => submitChanges({ parent: null })}
                  >
                    {issueDetail.parent_detail?.name}
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                ) : (
                  <div className="inline-block bg-gray-100 px-3 py-2 text-xs rounded">
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
            <div className="flex items-center py-2 flex-wrap">
              <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                <CalendarDaysIcon className="flex-shrink-0 h-4 w-4" />
                <p>Due date</p>
              </div>
              <div className="sm:basis-1/2">
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="date"
                      value={value ?? ""}
                      onChange={(e: any) => {
                        submitChanges({ target_date: e.target.value });
                        onChange(e.target.value);
                      }}
                      className="hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="py-1">
            <SelectCycle control={control} handleCycleChange={handleCycleChange} />
          </div>
        </div>
        <div className="pt-3 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-x-2 text-sm basis-1/2">
              <TagIcon className="w-4 h-4" />
              <p>Label</p>
            </div>
            <div className="basis-1/2">
              <div className="flex gap-1 flex-wrap">
                {watchIssue("labels_list")?.map((label) => {
                  const singleLabel = issueLabels?.find((l) => l.id === label);

                  if (!singleLabel) return null;

                  return (
                    <span
                      key={singleLabel.id}
                      className="group flex items-center gap-1 border rounded-2xl text-xs px-1 py-0.5 hover:bg-red-50 hover:border-red-500 cursor-pointer"
                      onClick={() => {
                        const updatedLabels = watchIssue("labels_list")?.filter((l) => l !== label);
                        submitChanges({
                          labels_list: updatedLabels,
                        });
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
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
                            <Listbox.Button className="flex items-center gap-2 border rounded-2xl text-xs px-2 py-0.5 hover:bg-gray-100 cursor-pointer">
                              Select Label
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-10 right-0 mt-1 w-40 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                <div className="py-1">
                                  {issueLabels ? (
                                    issueLabels.length > 0 ? (
                                      issueLabels.map((label: IIssueLabels) => (
                                        <Listbox.Option
                                          key={label.id}
                                          className={({ active, selected }) =>
                                            `${
                                              active || selected ? "bg-indigo-50" : ""
                                            } flex items-center gap-2 text-gray-900 cursor-pointer select-none relative p-2 truncate`
                                          }
                                          value={label.id}
                                        >
                                          <span
                                            className="h-2 w-2 rounded-full flex-shrink-0"
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
                  className="flex items-center gap-1 border rounded-2xl text-xs px-2 py-0.5 hover:bg-gray-100 cursor-pointer"
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
                        className={`bg-white flex items-center gap-1 rounded-md p-1 outline-none focus:ring-2 focus:ring-indigo-500`}
                      >
                        {watch("colour") && watch("colour") !== "" && (
                          <span
                            className="w-5 h-5 rounded"
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
                        <Popover.Panel className="absolute z-10 transform right-0 mt-1 px-2 max-w-xs sm:px-0">
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
              <Button type="submit" theme="success" disabled={isSubmitting}>
                +
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default IssueDetailSidebar;
