import React from "react";
// swr
import useSWR from "swr";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// react hook form
import { useForm, Controller } from "react-hook-form";
// services
import stateServices from "lib/services/state.services";
import issuesServices from "lib/services/issues.services";
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetching keys
import {
  PROJECT_ISSUES_LIST,
  STATE_LIST,
  WORKSPACE_MEMBERS,
  PROJECT_ISSUE_LABELS,
} from "constants/fetch-keys";
// commons
import { classNames, copyTextToClipboard } from "constants/common";
// ui
import { Input, Button } from "ui";
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
} from "@heroicons/react/24/outline";
// types
import type { Control } from "react-hook-form";
import type { IIssue, IIssueLabels, IssueResponse, IState, WorkspaceMember } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
  issueDetail: IIssue | undefined;
};

const PRIORITIES = ["high", "medium", "low"];

const defaultValues: Partial<IIssueLabels> = {
  name: "",
};

const IssueDetailSidebar: React.FC<Props> = ({ control, submitChanges, issueDetail }) => {
  const { activeWorkspace, activeProject } = useUser();

  const { data: states } = useSWR<IState[]>(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateServices.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: people } = useSWR<WorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  const { data: projectIssues } = useSWR<IssueResponse>(
    activeProject && activeWorkspace
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id)
      : null,
    activeProject && activeWorkspace
      ? () => issuesServices.getIssues(activeWorkspace.slug, activeProject.id)
      : null
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

  const sidebarOptions = [
    {
      label: "Priority",
      name: "priority",
      canSelectMultipleOptions: false,
      icon: ChartBarIcon,
      options: PRIORITIES.map((property) => ({
        label: property,
        value: property,
      })),
    },
    {
      label: "Status",
      name: "state",
      canSelectMultipleOptions: false,
      icon: Squares2X2Icon,
      options: states?.map((state) => ({
        label: state.name,
        value: state.id,
      })),
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
    },
    {
      label: "Blocker",
      name: "blockers_list",
      canSelectMultipleOptions: true,
      icon: UserIcon,
      options: projectIssues?.results?.map((issue) => ({
        label: issue.name,
        value: issue.id,
      })),
    },
    {
      label: "Blocked",
      name: "blocked_list",
      canSelectMultipleOptions: true,
      icon: UserIcon,
      options: projectIssues?.results?.map((issue) => ({
        label: issue.name,
        value: issue.id,
      })),
    },
  ];

  return (
    <div className="h-full w-full">
      <div className="space-y-3">
        <div className="flex flex-col gap-y-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
              onClick={() =>
                copyTextToClipboard(
                  `https://app.plane.so/projects/${activeProject?.id}/issues/${issueDetail?.id}`
                )
              }
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 duration-300"
              onClick={() => copyTextToClipboard(`${issueDetail?.id}`)}
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          {sidebarOptions.map((item) => (
            <div className="flex items-center justify-between gap-x-2" key={item.label}>
              <div className="flex items-center gap-x-2 text-sm">
                <item.icon className="h-4 w-4" />
                <p>{item.label}</p>
              </div>
              <div>
                <Controller
                  control={control}
                  name={item.name as keyof IIssue}
                  render={({ field: { value } }) => (
                    <Listbox
                      as="div"
                      value={value}
                      multiple={item.canSelectMultipleOptions}
                      onChange={(value: any) => submitChanges({ [item.name]: value })}
                      className="flex-shrink-0"
                    >
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm duration-300">
                            <span
                              className={classNames(
                                value ? "" : "text-gray-900",
                                "hidden truncate sm:block w-16 text-left",
                                item.label === "Priority" ? "capitalize" : ""
                              )}
                            >
                              {value
                                ? Array.isArray(value)
                                  ? value
                                      .map(
                                        (i: any) =>
                                          item.options?.find((option) => option.value === i)?.label
                                      )
                                      .join(", ") || item.label
                                  : item.options?.find((option) => option.value === value)?.label
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
                                {item.options?.map((option) => (
                                  <Listbox.Option
                                    key={option.value}
                                    className={({ active, selected }) =>
                                      `${
                                        active || selected ? "text-white bg-theme" : "text-gray-900"
                                      } ${
                                        item.label === "Priority" && "capitalize"
                                      } cursor-pointer select-none relative p-2 rounded-md truncate`
                                    }
                                    value={option.value}
                                  >
                                    {option.label}
                                  </Listbox.Option>
                                ))}
                              </div>
                            </Listbox.Options>
                          </Transition>
                        </div>
                      )}
                    </Listbox>
                  )}
                />
              </div>
            </div>
          ))}
          <div>
            <form className="flex items-center gap-x-2" onSubmit={handleSubmit(onSubmit)}>
              <Input
                id="name"
                name="name"
                placeholder="Add new label"
                register={register}
                validations={{
                  required: false,
                }}
                autoComplete="off"
              />
              <Button type="submit" disabled={isSubmitting}>
                +
              </Button>
            </form>
          </div>
          <div className="flex justify-between items-center gap-x-2">
            <div className="flex items-center gap-x-2 text-sm">
              <TagIcon className="w-4 h-4" />
              <p>Label</p>
            </div>
            <div>
              <Controller
                control={control}
                name="labels_list"
                render={({ field: { value } }) => (
                  <Listbox
                    as="div"
                    value={value}
                    multiple
                    onChange={(value) => submitChanges({ labels_list: value })}
                    className="flex-shrink-0"
                  >
                    {({ open }) => (
                      <>
                        <Listbox.Label className="sr-only">Label</Listbox.Label>
                        <div className="relative">
                          <Listbox.Button className="relative flex justify-between items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm duration-300">
                            <span
                              className={classNames(
                                value ? "" : "text-gray-900",
                                "hidden truncate capitalize sm:block w-16 text-left"
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
                                {issueLabels?.map((label: any) => (
                                  <Listbox.Option
                                    key={label.id}
                                    className={({ active, selected }) =>
                                      `${
                                        active || selected ? "text-white bg-theme" : "text-gray-900"
                                      } cursor-pointer select-none relative p-2 rounded-md truncate`
                                    }
                                    value={label.id}
                                  >
                                    {label.name}
                                  </Listbox.Option>
                                ))}
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
    </div>
  );
};

export default IssueDetailSidebar;
