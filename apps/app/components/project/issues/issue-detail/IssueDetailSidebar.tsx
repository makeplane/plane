import React, { useState } from "react";
// swr
import useSWR from "swr";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// react hook form
import { useForm, Controller, UseFormWatch } from "react-hook-form";
// services
import stateServices from "lib/services/state.service";
import issuesServices from "lib/services/issues.service";
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
import useToast from "lib/hooks/useToast";
// fetching keys
import {
  PROJECT_ISSUES_LIST,
  STATE_LIST,
  WORKSPACE_MEMBERS,
  PROJECT_ISSUE_LABELS,
} from "constants/fetch-keys";
// commons
import { classNames, copyTextToClipboard } from "constants/common";
import { PRIORITIES } from "constants/";
// ui
import { Input, Button, Spinner } from "ui";
import { Popover } from "@headlessui/react";
// icons
import {
  UserIcon,
  TagIcon,
  UserGroupIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
// types
import type { Control } from "react-hook-form";
import type { IIssue, IIssueLabels, IssueResponse, IState, NestedKeyOf } from "types";
import { TwitterPicker } from "react-color";
import IssuesListModal from "components/project/issues/IssuesListModal";

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
  watch: watchIssue,
  submitChanges,
  issueDetail,
}) => {
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  const { activeWorkspace, activeProject, cycles, issues } = useUser();

  const { setToastAlert } = useToast();

  const { data: states } = useSWR<IState[]>(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateServices.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: people } = useSWR(
    activeWorkspace ? WORKSPACE_MEMBERS(activeWorkspace.slug) : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

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

  const onSubmit = (formData: any) => {
    if (!activeWorkspace || !activeProject || isSubmitting) return;
    issuesServices
      .createIssueLabel(activeWorkspace.slug, activeProject.id, formData)
      .then((res) => {
        console.log(res);
        reset(defaultValues);
        issueLabelMutate((prevData) => [...(prevData ?? []), res], false);
      });
  };

  const sidebarSections: Array<
    Array<{
      label: string;
      name: NestedKeyOf<IIssue>;
      canSelectMultipleOptions: boolean;
      icon: (props: any) => JSX.Element;
      options?: Array<{ label: string; value: any }>;
      modal: boolean;
      issuesList?: Array<IIssue>;
      isOpen?: boolean;
      setIsOpen?: (arg: boolean) => void;
    }>
  > = [
    [
      {
        label: "Status",
        name: "state",
        canSelectMultipleOptions: false,
        icon: Squares2X2Icon,
        options: states?.map((state) => ({
          label: state.name,
          value: state.id,
        })),
        modal: false,
      },
      {
        label: "Assignees",
        name: "assignees_list",
        canSelectMultipleOptions: true,
        icon: UserGroupIcon,
        options: people?.map((person) => ({
          label: person.member.first_name,
          value: person.member.id,
        })),
        modal: false,
      },
      {
        label: "Priority",
        name: "priority",
        canSelectMultipleOptions: false,
        icon: ChartBarIcon,
        options: PRIORITIES.map((property) => ({
          label: property,
          value: property,
        })),
        modal: false,
      },
    ],
    [
      {
        label: "Parent",
        name: "parent",
        canSelectMultipleOptions: false,
        icon: UserIcon,
        issuesList:
          issues?.results.filter(
            (i) =>
              i.id !== issueDetail?.id &&
              i.id !== issueDetail?.parent &&
              i.parent !== issueDetail?.id
          ) ?? [],
        modal: true,
        isOpen: isParentModalOpen,
        setIsOpen: setIsParentModalOpen,
      },
      // {
      //   label: "Blocker",
      //   name: "blockers_list",
      //   canSelectMultipleOptions: true,
      //   icon: UserIcon,
      //   issuesList: issues?.results.filter((i) => i.id !== issueDetail?.id) ?? [],
      //   modal: true,
      //   isOpen: isBlockerModalOpen,
      //   setIsOpen: setIsBlockerModalOpen,
      // },
      // {
      //   label: "Blocked",
      //   name: "blocked_list",
      //   canSelectMultipleOptions: true,
      //   icon: UserIcon,
      //   issuesList: issues?.results.filter((i) => i.id !== issueDetail?.id) ?? [],
      //   modal: true,
      //   isOpen: isBlockedModalOpen,
      //   setIsOpen: setIsBlockedModalOpen,
      // },
      {
        label: "Target Date",
        name: "target_date",
        canSelectMultipleOptions: true,
        icon: CalendarDaysIcon,
        modal: false,
      },
    ],
    [
      {
        label: "Cycle",
        name: "cycle",
        canSelectMultipleOptions: false,
        icon: ArrowPathIcon,
        options: cycles?.map((cycle) => ({
          label: cycle.name,
          value: cycle.id,
        })),
        modal: false,
      },
    ],
  ];

  const handleCycleChange = (cycleId: string) => {
    if (activeWorkspace && activeProject && issueDetail)
      issuesServices.addIssueToSprint(activeWorkspace.slug, activeProject.id, cycleId, {
        issue: issueDetail.id,
      });
  };

  return (
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
              copyTextToClipboard(`${issueDetail?.id}`)
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
        </div>
      </div>
      <div className="divide-y-2 divide-gray-100">
        {sidebarSections.map((section, index) => (
          <div key={index} className="py-1">
            {section.map((item) => (
              <div key={item.label} className="flex items-center py-2 flex-wrap">
                <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
                  <item.icon className="flex-shrink-0 h-4 w-4" />
                  <p>{item.label}</p>
                </div>
                <div className="sm:basis-1/2">
                  {item.name === "target_date" ? (
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
                  ) : item.modal ? (
                    <Controller
                      control={control}
                      name={item.name as keyof IIssue}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <IssuesListModal
                            isOpen={Boolean(item?.isOpen)}
                            handleClose={() => item.setIsOpen && item.setIsOpen(false)}
                            onChange={(val) => {
                              console.log(val);
                              // submitChanges({ [item.name]: val });
                              onChange(val);
                            }}
                            issues={item?.issuesList ?? []}
                            title={`Select ${item.label}`}
                            multiple={item.canSelectMultipleOptions}
                            value={value}
                          />
                          <button
                            type="button"
                            className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 w-full"
                            onClick={() => item.setIsOpen && item.setIsOpen(true)}
                          >
                            {watchIssue(`${item.name as keyof IIssue}`) &&
                            watchIssue(`${item.name as keyof IIssue}`) !== ""
                              ? `${activeProject?.identifier}-
                                ${
                                  issues?.results.find(
                                    (i) => i.id === watchIssue(`${item.name as keyof IIssue}`)
                                  )?.sequence_id
                                }`
                              : `Select ${item.label}`}
                          </button>
                        </>
                      )}
                    />
                  ) : (
                    <Controller
                      control={control}
                      name={item.name as keyof IIssue}
                      render={({ field: { value } }) => (
                        <Listbox
                          as="div"
                          value={value}
                          multiple={item.canSelectMultipleOptions}
                          onChange={(value: any) => {
                            if (item.name === "cycle") handleCycleChange(value);
                            else submitChanges({ [item.name]: value });
                          }}
                          className="flex-shrink-0"
                        >
                          {({ open }) => (
                            <div className="relative">
                              <Listbox.Button className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 w-full py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                <span
                                  className={classNames(
                                    value ? "" : "text-gray-900",
                                    "hidden truncate sm:block text-left",
                                    item.label === "Priority" ? "capitalize" : ""
                                  )}
                                >
                                  {value
                                    ? Array.isArray(value)
                                      ? value
                                          .map(
                                            (i: any) =>
                                              item.options?.find((option) => option.value === i)
                                                ?.label
                                          )
                                          .join(", ") || item.label
                                      : item.options?.find((option) => option.value === value)
                                          ?.label
                                    : "None"}
                                </span>
                                <ChevronDownIcon className="h-3 w-3" />
                              </Listbox.Button>

                              <Transition
                                show={open}
                                as={React.Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 right-0 mt-1 w-40 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                  <div className="p-1">
                                    {item.options ? (
                                      item.options.length > 0 ? (
                                        item.options.map((option) => (
                                          <Listbox.Option
                                            key={option.value}
                                            className={({ active, selected }) =>
                                              `${
                                                active || selected
                                                  ? "text-white bg-theme"
                                                  : "text-gray-900"
                                              } ${
                                                item.label === "Priority" && "capitalize"
                                              } cursor-pointer select-none relative p-2 rounded-md truncate`
                                            }
                                            value={option.value}
                                          >
                                            {option.label}
                                          </Listbox.Option>
                                        ))
                                      ) : (
                                        <div className="text-center">No {item.label}s found</div>
                                      )
                                    ) : (
                                      <Spinner />
                                    )}
                                  </div>
                                </Listbox.Options>
                              </Transition>
                            </div>
                          )}
                        </Listbox>
                      )}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-3">
        <h5 className="text-xs font-medium">Add new label</h5>
        <form className="flex items-center gap-x-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`bg-white flex items-center gap-1 rounded-md p-1 outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    {watch("colour") && watch("colour") !== "" && (
                      <span
                        className="w-6 h-6 rounded"
                        style={{
                          backgroundColor: watch("colour") ?? "green",
                        }}
                      ></span>
                    )}
                    <ChevronDownIcon className="h-4 w-4" />
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
                          <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
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
          <Button type="submit" disabled={isSubmitting}>
            +
          </Button>
        </form>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-2 text-sm basis-1/2">
            <TagIcon className="w-4 h-4" />
            <p>Label</p>
          </div>
          <div className="basis-1/2">
            <Controller
              control={control}
              name="labels_list"
              render={({ field: { value } }) => (
                <Listbox
                  as="div"
                  value={value}
                  multiple
                  onChange={(value: any) => submitChanges({ labels_list: value })}
                  className="flex-shrink-0"
                >
                  {({ open }) => (
                    <>
                      <Listbox.Label className="sr-only">Label</Listbox.Label>
                      <div className="relative">
                        <Listbox.Button className="flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 w-full py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                          <span
                            className={classNames(
                              value ? "" : "text-gray-900",
                              "hidden truncate capitalize sm:block text-left"
                            )}
                          >
                            {value && value.length > 0
                              ? value
                                  .map(
                                    (i: string) =>
                                      issueLabels?.find((option) => option.id === i)?.name
                                  )
                                  .join(", ")
                              : "None"}
                          </span>
                          <ChevronDownIcon className="h-3 w-3" />
                        </Listbox.Button>

                        <Transition
                          show={open}
                          as={React.Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 right-0 mt-1 w-40 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            <div className="p-1">
                              {issueLabels ? (
                                issueLabels.length > 0 ? (
                                  issueLabels.map((label: IIssueLabels) => (
                                    <Listbox.Option
                                      key={label.id}
                                      className={({ active, selected }) =>
                                        `${
                                          active || selected
                                            ? "text-white bg-theme"
                                            : "text-gray-900"
                                        } flex items-center gap-2 cursor-pointer select-none relative p-2 rounded-md truncate`
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailSidebar;
