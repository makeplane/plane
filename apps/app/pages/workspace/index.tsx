// next
import type { NextPage } from "next";
import Link from "next/link";
// react
import React from "react";
// layouts
import AdminLayout from "layouts/AdminLayout";
// swr
import useSWR from "swr";
// hooks
import useUser from "lib/hooks/useUser";
// hoc
import withAuthWrapper from "lib/hoc/withAuthWrapper";
// fetch keys
import { USER_ISSUE } from "constants/fetch-keys";
// services
import userService from "lib/services/user.service";
// ui
import { Spinner } from "ui";
// icons
import { ArrowRightIcon } from "@heroicons/react/24/outline";
// types
import type { IIssue } from "types";

const Workspace: NextPage = () => {
  const { user, activeWorkspace, projects } = useUser();

  const { data: myIssues } = useSWR<IIssue[]>(
    user ? USER_ISSUE : null,
    user ? () => userService.userIssues() : null
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
    <AdminLayout>
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
                  <table className="h-full w-full overflow-y-auto">
                    <thead className="border-b bg-gray-50 text-sm">
                      <tr>
                        <th scope="col" className="px-3 py-4 text-left">
                          ISSUE
                        </th>
                        <th scope="col" className="px-3 py-4 text-left">
                          KEY
                        </th>
                        <th scope="col" className="px-3 py-4 text-left">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myIssues?.map((issue, index) => (
                        <tr
                          className="border-t transition duration-300 ease-in-out hover:bg-gray-100 text-gray-900 gap-3 text-sm"
                          key={index}
                        >
                          <td className="px-3 py-4 font-medium">
                            <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
                              <a className="hover:text-theme duration-300">{issue.name}</a>
                            </Link>
                          </td>
                          <td className="px-3 py-4">
                            {issue.project_detail?.identifier}-{issue.sequence_id}
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className="rounded px-2 py-1 text-xs font-medium"
                              style={{
                                border: `2px solid ${issue.state_detail.color}`,
                                backgroundColor: `${issue.state_detail.color}20`,
                              }}
                            >
                              {issue.state_detail.name ?? "None"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    </AdminLayout>
  );
};

export default withAuthWrapper(Workspace);
