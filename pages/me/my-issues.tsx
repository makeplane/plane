// next
import type { NextPage } from "next";
import Link from "next/link";
// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// layouts
import AdminLayout from "layouts/AdminLayout";
// hooks
import useUser from "lib/hooks/useUser";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// components
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import ChangeStateDropdown from "components/project/issues/my-issues/ChangeStateDropdown";
// ui
import { Spinner } from "ui";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";
import HeaderButton from "ui/HeaderButton";
import { Menu, Popover, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon, PlusIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
// services
import userService from "lib/services/user.service";
// types
import { IIssue, NestedKeyOf, Properties, WorkspaceMember } from "types";
// constants
import { USER_ISSUE, WORKSPACE_MEMBERS } from "constants/fetch-keys";
import {
  classNames,
  groupBy,
  renderShortNumericDateFormat,
  replaceUnderscoreIfSnakeCase,
} from "constants/common";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";
import workspaceService from "lib/services/workspace.service";
import useTheme from "lib/hooks/useTheme";
import issuesServices from "lib/services/issues.services";

const MyIssues: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { user, activeWorkspace, activeProject } = useUser();

  const { issueView, setIssueView, groupByProperty, setGroupByProperty } = useTheme();

  const { data: myIssues, mutate: mutateMyIssue } = useSWR<IIssue[]>(
    user ? USER_ISSUE : null,
    user ? () => userService.userIssues() : null
  );

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    activeProject?.id as string
  );

  const { data: people } = useSWR<WorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
    { name: "State", key: "state_detail.name" },
    { name: "Priority", key: "priority" },
    { name: "Created By", key: "created_by" },
  ];

  const groupedByIssues: {
    [key: string]: IIssue[];
  } = groupBy(myIssues ?? [], groupByProperty ?? "");

  const updateMyIssues = (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issue: Partial<IIssue>
  ) => {
    mutateMyIssue((prevData) => {
      return prevData?.map((prevIssue) => {
        if (prevIssue.id === issueId) {
          return {
            ...prevIssue,
            ...issue,
            state_detail: {
              ...prevIssue.state_detail,
              ...issue.state_detail,
            },
          };
        }
        return prevIssue;
      });
    }, false);
    issuesServices
      .patchIssue(workspaceSlug, projectId, issueId, issue)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <AdminLayout>
      <CreateUpdateIssuesModal isOpen={isOpen} setIsOpen={setIsOpen} />
      {myIssues ? (
        <>
          {myIssues.length > 0 ? (
            <div className="space-y-5">
              <Breadcrumbs>
                <BreadcrumbItem title="My Issues" />
              </Breadcrumbs>
              <div className="w-full flex items-center justify-between">
                <h2 className="text-2xl font-medium">My Issues</h2>
                <div className="flex items-center gap-x-3">
                  <Menu as="div" className="relative inline-block w-40">
                    <div className="w-full">
                      <Menu.Button className="inline-flex justify-between items-center w-full rounded-md shadow-sm p-2 bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none">
                        <span className="flex gap-x-1 items-center">
                          {groupByOptions.find((option) => option.key === groupByProperty)?.name ??
                            "No Grouping"}
                        </span>
                        <div className="flex-grow flex justify-end">
                          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        </div>
                      </Menu.Button>
                    </div>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-left absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-1">
                          {groupByOptions.map((option) => (
                            <Menu.Item key={option.key}>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`${
                                    active ? "bg-theme text-white" : "text-gray-900"
                                  } group flex w-full items-center rounded-md p-2 text-xs`}
                                  onClick={() => setGroupByProperty(option.key)}
                                >
                                  {option.name}
                                </button>
                              )}
                            </Menu.Item>
                          ))}
                          {issueView === "list" ? (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={`hover:bg-theme hover:text-white ${
                                    active ? "bg-theme text-white" : "text-gray-900"
                                  } group flex w-full items-center rounded-md p-2 text-xs`}
                                  onClick={() => setGroupByProperty(null)}
                                >
                                  No grouping
                                </button>
                              )}
                            </Menu.Item>
                          ) : null}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  <Popover className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button className="inline-flex justify-between items-center rounded-md shadow-sm p-2 bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none w-40">
                          <span>Properties</span>
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
                          <Popover.Panel className="absolute left-1/2 z-10 mt-1 -translate-x-1/2 transform px-2 sm:px-0 w-full">
                            <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="relative grid bg-white p-1">
                                {Object.keys(properties).map((key) => (
                                  <button
                                    key={key}
                                    className={`text-gray-900 hover:bg-theme hover:text-white flex justify-between w-full items-center rounded-md p-2 text-xs`}
                                    onClick={() => setProperties(key as keyof Properties)}
                                  >
                                    <p className="capitalize">{key.replace("_", " ")}</p>
                                    <span className="self-end">
                                      {properties[key as keyof Properties] ? (
                                        <EyeIcon width="18" height="18" />
                                      ) : (
                                        <EyeSlashIcon width="18" height="18" />
                                      )}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                  <HeaderButton
                    Icon={PlusIcon}
                    label="Add Issue"
                    onClick={() => {
                      const e = new KeyboardEvent("keydown", {
                        key: "i",
                        ctrlKey: true,
                      });
                      document.dispatchEvent(e);
                    }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle p-0.5">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          {Object.keys(properties).map(
                            (key) =>
                              properties[key as keyof Properties] && (
                                <th
                                  key={key}
                                  scope="col"
                                  className="px-3 py-3.5 text-left uppercase text-sm font-semibold text-gray-900"
                                >
                                  {replaceUnderscoreIfSnakeCase(key)}
                                </th>
                              )
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {myIssues.map((myIssue, index) => (
                          <tr
                            key={myIssue.id}
                            className={classNames(
                              index === 0 ? "border-gray-300" : "border-gray-200",
                              "border-t text-sm text-gray-900"
                            )}
                          >
                            {Object.keys(properties).map(
                              (key) =>
                                properties[key as keyof Properties] && (
                                  <td
                                    key={key}
                                    className="px-3 py-4 text-sm font-medium text-gray-900 relative"
                                  >
                                    {(key as keyof Properties) === "name" ? (
                                      <p className="w-[15rem]">
                                        <Link
                                          href={`/projects/${myIssue.project}/issues/${myIssue.id}`}
                                        >
                                          <a className="hover:text-theme duration-300">
                                            {myIssue.name}
                                          </a>
                                        </Link>
                                      </p>
                                    ) : (key as keyof Properties) === "key" ? (
                                      <p className="text-xs whitespace-nowrap">
                                        {activeProject?.identifier}-{myIssue.sequence_id}
                                      </p>
                                    ) : (key as keyof Properties) === "description" ? (
                                      <p className="truncate text-xs max-w-[15rem]">
                                        {myIssue.description}
                                      </p>
                                    ) : (key as keyof Properties) === "state" ? (
                                      <ChangeStateDropdown
                                        issue={myIssue}
                                        updateIssues={updateMyIssues}
                                      />
                                    ) : (key as keyof Properties) === "assignee" ? (
                                      <div className="max-w-xs text-xs">
                                        {myIssue.assignees && myIssue.assignees.length > 0
                                          ? myIssue.assignees.map((assignee, index) => (
                                              <p key={index}>
                                                {
                                                  people?.find((p) => p.member.id === assignee)
                                                    ?.member.email
                                                }
                                              </p>
                                            ))
                                          : "None"}
                                      </div>
                                    ) : (key as keyof Properties) === "target_date" ? (
                                      <p className="whitespace-nowrap">
                                        {myIssue.target_date
                                          ? renderShortNumericDateFormat(myIssue.target_date)
                                          : "-"}
                                      </p>
                                    ) : (
                                      <p className="capitalize text-sm">
                                        {myIssue[key as keyof IIssue] ??
                                          (myIssue[key as keyof IIssue] as any)?.name ??
                                          "None"}
                                      </p>
                                    )}
                                  </td>
                                )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full grid place-items-center px-4 sm:px-0">
              <EmptySpace
                title="You don't have any issue assigned to you yet."
                description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
                Icon={RectangleStackIcon}
              >
                <EmptySpaceItem
                  title="Create a new issue"
                  description={
                    <span>
                      Use{" "}
                      <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + I</pre>{" "}
                      shortcut to create a new issue
                    </span>
                  }
                  Icon={PlusIcon}
                  action={() => setIsOpen(true)}
                />
              </EmptySpace>
            </div>
          )}
        </>
      ) : (
        <div className="h-full w-full grid place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </AdminLayout>
  );
};

export default MyIssues;
