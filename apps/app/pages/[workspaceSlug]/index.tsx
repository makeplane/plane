import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// icons
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { Spinner } from "components/ui";
import { WorkspaceHomeCardsList, WorkspaceHomeGreetings } from "components/workspace";
// hooks
import useProjects from "hooks/use-projects";
import useWorkspaceDetails from "hooks/use-workspace-details";
import useIssues from "hooks/use-issues";
// icons
import { LayerDiagonalIcon } from "components/icons";
// helpers
import { renderShortNumericDateFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { groupBy } from "helpers/array.helper";
// types
import type { NextPage, NextPageContext } from "next";
// constants
import { getPriorityIcon } from "constants/global";

const WorkspacePage: NextPage = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // API Fetching
  const { myIssues } = useIssues(workspaceSlug?.toString());
  const { projects, recentProjects } = useProjects();
  const {} = useWorkspaceDetails();

  const groupedIssues = {
    backlog: [],
    unstarted: [],
    started: [],
    cancelled: [],
    completed: [],
    ...groupBy(myIssues ?? [], "state_detail.group"),
  };

  return (
    <AppLayout noHeader={true}>
      <div className="h-full w-full space-y-5">
        <div className="flex flex-col gap-5">
          <WorkspaceHomeGreetings />
          <WorkspaceHomeCardsList
            groupedIssues={groupedIssues}
            myIssues={myIssues}
            projects={projects}
          />
          {/** TODO: Convert the below mentioned HTML Content to separate component */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 rounded-lg border bg-white">
              <div className="max-h-[30rem] w-full overflow-y-auto shadow-sm">
                {myIssues ? (
                  myIssues.length > 0 ? (
                    <div className="flex flex-col space-y-5">
                      <div className="rounded-lg bg-white">
                        <div className="rounded-t-lg bg-gray-100 px-4 py-3">
                          <div className="flex items-center gap-x-2">
                            <LayerDiagonalIcon className="h-5 w-5" color="gray" />
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
                                  {getPriorityIcon(issue.priority)}
                                </div>

                                <div className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                  <span
                                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
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
                                    <div>
                                      {renderShortNumericDateFormat(issue.target_date ?? "")}
                                    </div>
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
                    <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                      <LayerDiagonalIcon height="56" width="56" />
                      <h3 className="text-gray-500">
                        No issues found. Create a new issue with{" "}
                        <pre className="inline rounded bg-gray-100 px-2 py-1">C</pre>.
                      </h3>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center p-10">
                    <Spinner />
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-white">
              <div className="flex items-center gap-2 rounded-t-lg bg-gray-100 px-4 py-3">
                <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
                <h2 className="font-medium leading-5">Recent Projects</h2>
              </div>
              <div className="space-y-5 p-4">
                {recentProjects && workspaceSlug ? (
                  recentProjects.length > 0 ? (
                    recentProjects.map((project) => (
                      <Link
                        href={`/${workspaceSlug}/projects/${project.id}/issues`}
                        key={project.id}
                      >
                        <a className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {project.icon ? (
                              <span className="grid flex-shrink-0 place-items-center rounded uppercase text-white">
                                {String.fromCodePoint(parseInt(project.icon))}
                              </span>
                            ) : (
                              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                                {project?.name.charAt(0)}
                              </span>
                            )}
                            <h3>{project.name}</h3>
                          </div>
                          <div className="text-gray-400">
                            <ArrowRightIcon className="h-4 w-4" />
                          </div>
                        </a>
                      </Link>
                    ))
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

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default WorkspacePage;
