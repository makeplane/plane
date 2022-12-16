// react
import React from "react";
// next
import Link from "next/link";
import type { NextPage } from "next";
// swr
import useSWR from "swr";
// headless ui
import { Transition, Popover } from "@headlessui/react";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import {
  Spinner,
  HeaderButton,
  EmptySpace,
  EmptySpaceItem,
  Breadcrumbs,
  BreadcrumbItem,
  CustomMenu,
} from "ui";
// constants
import { USER_ISSUE } from "constants/fetch-keys";
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
// services
import userService from "lib/services/user.service";
import issuesServices from "lib/services/issues.service";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
import useMyIssuesProperties from "lib/hooks/useMyIssueFilter";
// components
import ChangeStateDropdown from "components/project/issues/my-issues/ChangeStateDropdown";
// icons
import { ChevronDownIcon, PlusIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, NestedKeyOf, Properties } from "types";

const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  { name: "Cycle", key: "issue_cycle.cycle_detail.name" },
  { name: "Created By", key: "created_by" },
  { name: "None", key: null },
];

const MyIssues: NextPage = () => {
  const { user, activeWorkspace } = useUser();

  const { data: myIssues, mutate: mutateMyIssues } = useSWR<IIssue[]>(
    user && activeWorkspace ? USER_ISSUE(activeWorkspace.slug) : null,
    user && activeWorkspace ? () => userService.userIssues(activeWorkspace.slug) : null
  );

  const updateMyIssues = (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issue: Partial<IIssue>
  ) => {
    mutateMyIssues((prevData) => {
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

  const {
    filteredIssues,
    properties,
    setMyIssueGroupByProperty,
    setMyIssueProperty,
    groupByProperty,
  } = useMyIssuesProperties(myIssues);

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Issues" />
        </Breadcrumbs>
      }
      right={
        <>
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={classNames(
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                    "group flex gap-2 items-center rounded-md bg-transparent text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none border p-2"
                  )}
                >
                  <span>View</span>
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
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
                  <Popover.Panel className="absolute mr-5 right-1/2 z-10 mt-1 w-screen max-w-xs translate-x-1/2 transform p-3 bg-white rounded-lg shadow-lg">
                    <div className="relative flex flex-col gap-1 gap-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm text-gray-600">Group by</h4>
                        <CustomMenu
                          label={
                            groupByOptions.find((option) => option.key === groupByProperty)?.name ??
                            "Select"
                          }
                        >
                          {groupByOptions.map((option) => (
                            <CustomMenu.MenuItem
                              key={option.key}
                              onClick={() => setMyIssueGroupByProperty(option.key)}
                            >
                              {option.name}
                            </CustomMenu.MenuItem>
                          ))}
                        </CustomMenu>
                      </div>
                      <div className="border-b-2"></div>
                      <div className="relative flex flex-col gap-1">
                        <h4 className="text-base text-gray-600">Properties</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.keys(properties).map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`px-2 py-1 capitalize rounded border border-theme text-xs ${
                                properties[key as keyof Properties]
                                  ? "border-theme bg-theme text-white"
                                  : ""
                              }`}
                              onClick={() => setMyIssueProperty(key as keyof Properties)}
                            >
                              {replaceUnderscoreIfSnakeCase(key)}
                            </button>
                          ))}
                        </div>
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
        </>
      }
    >
      <div className="w-full h-full flex flex-col space-y-5">
        {myIssues ? (
          <>
            {myIssues.length > 0 ? (
              <div className="flex flex-col">
                <div className="overflow-x-auto ">
                  <div className="inline-block min-w-full align-middle px-0.5 py-2">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr className="text-left">
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                            >
                              NAME
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                            >
                              DESCRIPTION
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                            >
                              PROJECT
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                            >
                              PRIORITY
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                            >
                              STATUS
                            </th>
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
                              <td className="px-3 py-4 text-sm font-medium text-gray-900 hover:text-theme max-w-[15rem] duration-300">
                                <Link href={`/projects/${myIssue.project}/issues/${myIssue.id}`}>
                                  <a>{myIssue.name}</a>
                                </Link>
                              </td>
                              <td className="px-3 py-4 max-w-[15rem] truncate">
                                {/* {myIssue.description} */}
                              </td>
                              <td className="px-3 py-4">
                                {myIssue.project_detail?.name}
                                <br />
                                <span className="text-xs">{`(${myIssue.project_detail?.identifier}-${myIssue.sequence_id})`}</span>
                              </td>
                              <td className="px-3 py-4 capitalize">{myIssue.priority}</td>
                              <td className="relative px-3 py-4">
                                <ChangeStateDropdown
                                  issue={myIssue}
                                  updateIssues={updateMyIssues}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center px-4">
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
                    action={() => {
                      const e = new KeyboardEvent("keydown", {
                        key: "i",
                        ctrlKey: true,
                      });
                      document.dispatchEvent(e);
                    }}
                  />
                </EmptySpace>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default withAuth(MyIssues);
