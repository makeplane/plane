// react
import React from "react";
// next
import Link from "next/link";
import type { NextPage } from "next";
// swr
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
import { USER_ISSUE } from "constants/fetch-keys";
// common
import {
  addSpaceIfCamelCase,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";

const Workspace: NextPage = () => {
  const { user, activeWorkspace, projects } = useUser();

  const { data: myIssues } = useSWR<IIssue[]>(
    user && activeWorkspace ? USER_ISSUE(activeWorkspace.slug) : null,
    user && activeWorkspace ? () => userService.userIssues(activeWorkspace.slug) : null
  );

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

  const hours = new Date().getHours();

  return (
    <AppLayout noHeader={true}>
      <div className="h-full w-full space-y-5">
        {user ? (
          <div className="font-medium text-2xl">
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
            <div className="font-semibold text-2xl h-8 bg-gray-200 rounded dark:bg-gray-700 w-60"></div>
          </div>
        )}

        {/* dashboard */}
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-5">
            {cards.map(({ id, title, numbers }) => (
              <div className="py-6 px-6 min-w-[150px] flex-1 bg-white rounded-lg shadow" key={id}>
                <p className="text-gray-500 mt-2 uppercase">#{title}</p>
                <h2 className="text-2xl font-semibold">{numbers}</h2>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="max-h-[30rem] overflow-y-auto w-full border border-gray-200 bg-white rounded-lg shadow-sm col-span-2">
              {myIssues ? (
                myIssues.length > 0 ? (
                  <div className="flex flex-col space-y-5">
                    <div className="bg-white rounded-lg">
                      <div className="bg-gray-100 px-4 py-3 rounded-t-lg">
                        <div className="flex items-center gap-x-2">
                          <h2 className="font-medium leading-5">My Issues</h2>
                          <p className="text-gray-500 text-sm">{myIssues.length}</p>
                        </div>
                      </div>
                      <div className="divide-y-2">
                        {myIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="px-4 py-3 text-sm rounded flex justify-between items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex-shrink-0 h-1.5 w-1.5 block rounded-full`}
                                style={{
                                  backgroundColor: issue.state_detail.color,
                                }}
                              />
                              <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
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
                            <div className="flex-shrink-0 flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
                              <div
                                className={`rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
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

                              <div className="flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                <span
                                  className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor: issue.state_detail.color,
                                  }}
                                ></span>
                                {addSpaceIfCamelCase(issue.state_detail.name)}
                              </div>
                              <div
                                className={`group relative flex-shrink-0 group flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
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
                                <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                  <h5 className="font-medium mb-1 text-gray-900">Target date</h5>
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
                    <p className="text-gray-500 text-center">No Issues Found</p>
                  </div>
                )
              ) : (
                <div className="flex justify-center items-center p-10">
                  <Spinner />
                </div>
              )}
            </div>
            <div className="py-6 px-6 min-w-[150px] flex-1 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-5">PROJECTS</h3>
              <div className="space-y-3">
                {projects && activeWorkspace ? (
                  projects.length > 0 ? (
                    projects
                      .sort((a, b) => Date.parse(`${a.updated_at}`) - Date.parse(`${b.updated_at}`))
                      .map(
                        (project, index) =>
                          index < 3 && (
                            <Link href={`/projects/${project.id}/issues`} key={project.id}>
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
                  <div className="w-full h-full flex items-center justify-center">
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
