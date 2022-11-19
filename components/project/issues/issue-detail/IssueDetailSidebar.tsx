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
import { classNames } from "constants/common";
// ui
import { Input, Button } from "ui";
// icons
import { Bars3BottomRightIcon, PlusIcon, UserIcon, TagIcon } from "@heroicons/react/24/outline";
// types
import type { Control } from "react-hook-form";
import type { IIssue, IIssueLabels, IssueResponse, IState, WorkspaceMember } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (formData: Partial<IIssue>) => void;
};

const PRIORITIES = ["high", "medium", "low"];

const defaultValues: Partial<IIssueLabels> = {
  name: "",
};

const IssueDetailSidebar: React.FC<Props> = ({ control, submitChanges }) => {
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

  return (
    <div className="w-full h-full">
      <div className="space-y-3">
        <div className="flex flex-col gap-y-4">
          {[
            {
              label: "Priority",
              name: "priority",
              canSelectMultipleOptions: false,
              icon: Bars3BottomRightIcon,
              options: PRIORITIES.map((property) => ({
                label: property,
                value: property,
              })),
            },
            {
              label: "Status",
              name: "state",
              canSelectMultipleOptions: false,
              icon: Bars3BottomRightIcon,
              options: states?.map((state) => ({
                label: state.name,
                value: state.id,
              })),
            },
            {
              label: "Assignees",
              name: "assignees_list",
              canSelectMultipleOptions: true,
              icon: UserIcon,
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
          ].map((item) => (
            <div className="flex items-center gap-x-2" key={item.label}>
              <div className="flex items-center gap-x-2">
                <item.icon className="w-5 h-5 text-gray-500" />
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
                      onChange={(value) => submitChanges({ [item.name]: value })}
                      className="flex-shrink-0"
                    >
                      {({ open }) => (
                        <>
                          <Listbox.Label className="sr-only">{item.label}</Listbox.Label>
                          <div className="relative">
                            <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 py-2 px-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3 border border-dashed">
                              <PlusIcon
                                className="h-5 w-5 flex-shrink-0 text-gray-300 sm:-ml-1"
                                aria-hidden="true"
                              />
                              <span
                                className={classNames(
                                  value ? "" : "text-gray-900",
                                  "hidden truncate capitalize sm:ml-2 sm:block w-16"
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
                                        .join(", ") || `Select ${item.label}`
                                    : item.options?.find((option) => option.value === value)?.label
                                  : `Select ${item.label}`}
                              </span>
                            </Listbox.Button>

                            <Transition
                              show={open}
                              as={React.Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {item.options?.map((option) => (
                                  <Listbox.Option
                                    key={option.value}
                                    className={({ active, selected }) =>
                                      classNames(
                                        active || selected ? "bg-indigo-50" : "bg-white",
                                        "relative cursor-default select-none py-2 px-3"
                                      )
                                    }
                                    value={option.value}
                                  >
                                    <div className="flex items-center">
                                      <span className="ml-3 block capitalize font-medium">
                                        {option.label}
                                      </span>
                                    </div>
                                  </Listbox.Option>
                                ))}
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
          ))}
          <div>
            <form className="flex" onSubmit={handleSubmit(onSubmit)}>
              <Input
                id="name"
                name="name"
                placeholder="Add label"
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
          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-x-2">
              <TagIcon className="w-5 h-5 text-gray-500" />
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
                          <Listbox.Button className="relative inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 py-2 px-2 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:px-3 border border-dashed">
                            <PlusIcon
                              className="h-5 w-5 flex-shrink-0 text-gray-300 sm:-ml-1"
                              aria-hidden="true"
                            />
                            <span
                              className={classNames(
                                value ? "" : "text-gray-900",
                                "hidden truncate capitalize sm:ml-2 sm:block w-16"
                              )}
                            >
                              {value && value.length > 0
                                ? value
                                    .map(
                                      (i: string) =>
                                        issueLabels?.find((option) => option.id === i)?.name
                                    )
                                    .join(", ")
                                : `Select label`}
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-56 w-52 overflow-auto rounded-lg bg-white py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {issueLabels?.map((label: any) => (
                                <Listbox.Option
                                  key={label.id}
                                  className={({ active, selected }) =>
                                    classNames(
                                      active || selected ? "bg-indigo-50" : "bg-white",
                                      "relative cursor-default select-none py-2 px-3"
                                    )
                                  }
                                  value={label.id}
                                >
                                  <div className="flex items-center">
                                    <span className="ml-3 block capitalize font-medium">
                                      {label.name}
                                    </span>
                                  </div>
                                </Listbox.Option>
                              ))}
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
