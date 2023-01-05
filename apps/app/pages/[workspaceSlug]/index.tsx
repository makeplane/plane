import React from "react";

import Link from "next/link";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import userService from "lib/services/user.service";
// hooks
import useUser from "lib/hooks/useUser";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// layouts
import AppLayout from "layouts/app-layout";
// ui
import { Spinner } from "ui";
// icons
import { ArrowRightIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue } from "types";
// fetch-keys
import { PROJECTS_LIST, USER_ISSUE } from "constants/fetch-keys";
// common
import {
  addSpaceIfCamelCase,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
import projectService from "lib/services/project.service";

const Workspace: NextPage = () => {
  const { user } = useUser();

  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: myIssues } = useSWR<IIssue[]>(
    workspaceSlug ? USER_ISSUE(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userIssues(workspaceSlug as string) : null
  );

  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => projectService.getProjects(workspaceSlug as string) : null
  );

  const hours = new Date().getHours();
  const cards = [
    {
      id: 1,
      numbers: projects?.length ?? 0,
      title: "Projects",
    },
    {
      id: 3,
      numbers: myIssues?.length ?? 0,
      title: "Issues",
    },
  ];

  return (
    <AppLayout noHeader={true}>
      <div className="h-full w-full space-y-5">
        {user ? (
          <div className="text-2xl font-medium">
            Good{" "}
            {hours >= 4 && hours < 12
              ? "Morning"
              : hours >= 12 && hours < 17
              ? "Afternoon"
              : "Evening"}
            , {user.first_name}!!
          </div>
        ) : (
          <div className="animate-pulse" role="status">
            <div className="h-8 w-60 rounded bg-gray-200 text-2xl font-semibold dark:bg-gray-700"></div>
          </div>
        )}

        {/* dashboard */}
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-5">
            {cards.map(({ id, title, numbers }) => (
              <div className="min-w-[150px] flex-1 rounded-lg bg-white py-6 px-6 shadow" key={id}>
                <p className="mt-2 uppercase text-gray-500">#{title}</p>
                <h2 className="text-2xl font-semibold">{numbers}</h2>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 max-h-[30rem] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
              {myIssues ? (
                myIssues.length > 0 ? (
                  <div className="flex flex-col space-y-5">
                    <div className="rounded-lg bg-white">
                      <div className="rounded-t-lg bg-gray-100 px-4 py-3">
                        <div className="flex items-center gap-x-2">
                          <h2 className="font-medium leading-5">My Issues</h2>
                          <p className="text-sm text-gray-500">{myIssues.length}</p>
                        </div>
                      </div>
                      <div className="divide-y-2">
                        {myIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-center justify-between gap-2 rounded px-4 py-3 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
                                style={{
                                  backgroundColor: issue.state_detail.color,
                                }}
                              />
                              <Link
                                href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
                              >
                                <a className="group relative flex items-center gap-2">
                                  {/* {properties.key && (
                                          <span className="flex-shrink-0 text-xs text-gray-500">
                                            {issue.project_detail.identifier}-{issue.sequence_id}
                                          </span>
                                        )} */}
                                  <span className="">{issue.name}</span>
                                </a>
                              </Link>
                            </div>
                            <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
                              <div
                                className={`cursor-pointer rounded px-2 py-1 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  issue.priority === "urgent"
                                    ? "bg-red-100 text-red-600"
                                    : issue.priority === "high"
                                    ? "bg-orange-100 text-orange-500"
                                    : issue.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-500"
                                    : issue.priority === "low"
                                    ? "bg-green-100 text-green-500"
                                    : "bg-gray-100"
                                }`}
                              >
                                {issue.priority ?? "None"}
                              </div>

                              <div className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <span
                                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: issue.state_detail.color,
                                  }}
                                ></span>
                                {addSpaceIfCamelCase(issue.state_detail.name)}
                              </div>
                              <div
                                className={`group group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  issue.target_date === null
                                    ? ""
                                    : issue.target_date < new Date().toISOString()
                                    ? "text-red-600"
                                    : findHowManyDaysLeft(issue.target_date) <= 3 &&
                                      "text-orange-400"
                                }`}
                              >
                                <CalendarDaysIcon className="h-4 w-4" />
                                {issue.target_date
                                  ? renderShortNumericDateFormat(issue.target_date)
                                  : "N/A"}
                                <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                  <h5 className="mb-1 font-medium text-gray-900">Target date</h5>
                                  <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
                                  <div>
                                    {issue.target_date &&
                                      (issue.target_date < new Date().toISOString()
                                        ? `Target date has passed by ${findHowManyDaysLeft(
                                            issue.target_date
                                          )} days`
                                        : findHowManyDaysLeft(issue.target_date) <= 3
                                        ? `Target date is in ${findHowManyDaysLeft(
                                            issue.target_date
                                          )} days`
                                        : "Target date")}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="m-10">
                    <p className="text-center text-gray-500">No Issues Found</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center p-10">
                  <Spinner />
                </div>
              )}
            </div>
            <div className="min-w-[150px] flex-1 rounded-lg bg-white py-6 px-6 shadow">
              <h3 className="mb-5 text-lg font-semibold">PROJECTS</h3>
              <div className="space-y-3">
                {projects && workspaceSlug ? (
                  projects.length > 0 ? (
                    projects
                      .sort((a, b) => Date.parse(`${a.updated_at}`) - Date.parse(`${b.updated_at}`))
                      .map(
                        (project, index) =>
                          index < 3 && (
                            <Link
                              href={`/${workspaceSlug}/projects/${project.id}/issues`}
                              key={project.id}
                            >
                              <a className="flex justify-between">
                                <div>
                                  <h3>{project.name}</h3>
                                </div>
                                <div className="text-gray-400">
                                  <ArrowRightIcon className="w-5" />
                                </div>
                              </a>
                            </Link>
                          )
                      )
                  ) : (
                    <p className="text-gray-500">No projects has been create for this workspace.</p>
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default withAuthWrapper(Workspace);
