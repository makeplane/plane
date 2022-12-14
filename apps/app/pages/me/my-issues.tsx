// react
import React, { useState } from "react";
// next
import type { NextPage } from "next";
// swr
import useSWR from "swr";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Spinner } from "ui";
import { BreadcrumbItem, Breadcrumbs } from "ui/Breadcrumbs";
import { EmptySpace, EmptySpaceItem } from "ui/EmptySpace";
import HeaderButton from "ui/HeaderButton";
// constants
import { USER_ISSUE } from "constants/fetch-keys";
import { classNames } from "constants/common";
// services
import userService from "lib/services/user.service";
import issuesServices from "lib/services/issues.service";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// components
import ChangeStateDropdown from "components/project/issues/my-issues/ChangeStateDropdown";
// icons
import { ChevronDownIcon, PlusIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
// types
import { IIssue } from "types";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";

const MyIssues: NextPage = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  const { user, workspaces, activeWorkspace } = useUser();

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

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Issues" />
        </Breadcrumbs>
      }
      right={
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
