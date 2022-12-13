// react
import React, { useState } from "react";
// next
import Link from "next/link";
import Image from "next/image";
// swr
import useSWR, { mutate } from "swr";
// ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IssueResponse, NestedKeyOf, Properties } from "types";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { PRIORITIES } from "constants/";
import { PROJECT_ISSUES_LIST, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// services
import issuesServices from "lib/services/issues.service";
import workspaceService from "lib/services/workspace.service";
// constants
import { addSpaceIfCamelCase, classNames, renderShortNumericDateFormat } from "constants/common";

// types
type Props = {
  properties: Properties;
  groupedByIssues: any;
  selectedGroup: NestedKeyOf<IIssue> | null;
  setSelectedIssue: any;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const ListView: React.FC<Props> = ({
  properties,
  groupedByIssues,
  selectedGroup,
  setSelectedIssue,
  handleDeleteIssue,
}) => {
  const { activeWorkspace, activeProject, states } = useUser();

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!activeWorkspace || !activeProject) return;
    issuesServices
      .patchIssue(activeWorkspace.slug, activeProject.id, issueId, formData)
      .then((response) => {
        mutate<IssueResponse>(
          PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id),
          (prevData) => ({
            ...(prevData as IssueResponse),
            results:
              prevData?.results.map((issue) => (issue.id === response.id ? response : issue)) ?? [],
          }),
          false
        );
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const { data: people } = useSWR(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <div className="mt-4 flex flex-col space-y-5">
      {Object.keys(groupedByIssues).map((singleGroup) => (
        <div key={singleGroup} className="overflow-x-auto">
          <div className="inline-block min-w-full p-0.5 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full">
                {selectedGroup !== null ? (
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        colSpan={14}
                        scope="col"
                        className="px-3 py-3.5 text-left uppercase text-sm font-semibold text-gray-900"
                      >
                        <div className="flex items-center gap-2">
                          {selectedGroup === "state_detail.name" ? (
                            <span
                              className="flex-shrink-0 h-1.5 w-1.5 block rounded-full"
                              style={{
                                backgroundColor: states?.find((s) => s.name === singleGroup)?.color,
                              }}
                            ></span>
                          ) : null}
                          {singleGroup === null || singleGroup === "null"
                            ? selectedGroup === "priority" && "No priority"
                            : addSpaceIfCamelCase(singleGroup)}
                          <span className="ml-2 text-gray-500 font-normal text-sm">
                            {groupedByIssues[singleGroup as keyof IIssue].length}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                ) : (
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        colSpan={14}
                        scope="col"
                        className="px-3 py-3.5 text-left uppercase text-sm font-semibold text-gray-900"
                      >
                        ALL ISSUES
                        <span className="ml-2 text-gray-500 font-normal text-sm">
                          {groupedByIssues[singleGroup as keyof IIssue].length}
                        </span>
                      </th>
                    </tr>
                  </thead>
                )}
                <tbody className="bg-white">
                  {groupedByIssues[singleGroup].length > 0
                    ? groupedByIssues[singleGroup].map((issue: IIssue, index: number) => {
                        const assignees = [
                          ...(issue?.assignees_list ?? []),
                          ...(issue?.assignees ?? []),
                        ]?.map(
                          (assignee) => people?.find((p) => p.member.id === assignee)?.member.email
                        );

                        return (
                          <tr
                            key={issue.id}
                            className={classNames(
                              index === 0 ? "border-gray-300" : "border-gray-200",
                              "border-t"
                            )}
                          >
                            <td className="px-3 py-4 text-sm font-medium text-gray-900 w-[15rem]">
                              <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
                                <a className="hover:text-theme duration-300">{issue.name}</a>
                              </Link>
                            </td>
                            {Object.keys(properties).map(
                              (key) =>
                                properties[key as keyof Properties] && (
                                  <React.Fragment key={key}>
                                    {(key as keyof Properties) === "key" ? (
                                      <td className="px-3 py-4 font-medium text-gray-900 text-xs whitespace-nowrap">
                                        {activeProject?.identifier}-{issue.sequence_id}
                                      </td>
                                    ) : (key as keyof Properties) === "priority" ? (
                                      <td className="px-3 py-4 text-sm font-medium text-gray-900 relative">
                                        <Listbox
                                          as="div"
                                          value={issue.priority}
                                          onChange={(data: string) => {
                                            partialUpdateIssue({ priority: data }, issue.id);
                                          }}
                                          className="flex-shrink-0"
                                        >
                                          {({ open }) => (
                                            <>
                                              <div className="">
                                                <Listbox.Button className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-50 py-1 px-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 border">
                                                  <span
                                                    className={classNames(
                                                      issue.priority ? "" : "text-gray-900",
                                                      "hidden truncate capitalize sm:block w-16"
                                                    )}
                                                  >
                                                    {issue.priority ?? "None"}
                                                  </span>
                                                </Listbox.Button>

                                                <Transition
                                                  show={open}
                                                  as={React.Fragment}
                                                  leave="transition ease-in duration-100"
                                                  leaveFrom="opacity-100"
                                                  leaveTo="opacity-0"
                                                >
                                                  <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                                    {PRIORITIES?.map((priority) => (
                                                      <Listbox.Option
                                                        key={priority}
                                                        className={({ active }) =>
                                                          classNames(
                                                            active ? "bg-indigo-50" : "bg-white",
                                                            "cursor-pointer capitalize select-none px-3 py-2"
                                                          )
                                                        }
                                                        value={priority}
                                                      >
                                                        {priority}
                                                      </Listbox.Option>
                                                    ))}
                                                  </Listbox.Options>
                                                </Transition>
                                              </div>
                                            </>
                                          )}
                                        </Listbox>
                                      </td>
                                    ) : (key as keyof Properties) === "assignee" ? (
                                      <td className="px-3 py-4 text-sm font-medium text-gray-900 relative">
                                        <Listbox
                                          as="div"
                                          value={issue.assignees}
                                          onChange={(data: any) => {
                                            const newData = issue.assignees ?? [];
                                            if (newData.includes(data)) {
                                              newData.splice(newData.indexOf(data), 1);
                                            } else {
                                              newData.push(data);
                                            }
                                            partialUpdateIssue(
                                              { assignees_list: newData },
                                              issue.id
                                            );
                                          }}
                                          className="flex-shrink-0"
                                        >
                                          {({ open }) => (
                                            <>
                                              <div>
                                                <Listbox.Button className="rounded-full bg-gray-50 px-5 py-1 text-xs text-gray-500 hover:bg-gray-100 border">
                                                  {() => {
                                                    if (assignees.length > 0)
                                                      return (
                                                        <>
                                                          {assignees.map((assignee, index) => (
                                                            <div
                                                              key={index}
                                                              className={
                                                                "hidden truncate sm:block text-left"
                                                              }
                                                            >
                                                              {assignee}
                                                            </div>
                                                          ))}
                                                        </>
                                                      );
                                                    else return <span>None</span>;
                                                  }}
                                                </Listbox.Button>

                                                <Transition
                                                  show={open}
                                                  as={React.Fragment}
                                                  leave="transition ease-in duration-100"
                                                  leaveFrom="opacity-100"
                                                  leaveTo="opacity-0"
                                                >
                                                  <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                                    {people?.map((person) => (
                                                      <Listbox.Option
                                                        key={person.id}
                                                        className={({ active }) =>
                                                          classNames(
                                                            active ? "bg-indigo-50" : "bg-white",
                                                            "cursor-pointer select-none px-3 py-2"
                                                          )
                                                        }
                                                        value={person.member.id}
                                                      >
                                                        <div
                                                          className={`flex items-center gap-x-1 ${
                                                            assignees.includes(
                                                              person.member.first_name
                                                            )
                                                              ? "font-medium"
                                                              : "font-normal"
                                                          }`}
                                                        >
                                                          {person.member.avatar &&
                                                          person.member.avatar !== "" ? (
                                                            <div className="relative w-4 h-4">
                                                              <Image
                                                                src={person.member.avatar}
                                                                alt="avatar"
                                                                className="rounded-full"
                                                                layout="fill"
                                                                objectFit="cover"
                                                              />
                                                            </div>
                                                          ) : (
                                                            <p>
                                                              {person.member.first_name.charAt(0)}
                                                            </p>
                                                          )}
                                                          <p>{person.member.first_name}</p>
                                                        </div>
                                                      </Listbox.Option>
                                                    ))}
                                                  </Listbox.Options>
                                                </Transition>
                                              </div>
                                            </>
                                          )}
                                        </Listbox>
                                      </td>
                                    ) : (key as keyof Properties) === "state" ? (
                                      <td className="px-3 py-4 text-sm font-medium text-gray-900 relative">
                                        <Listbox
                                          as="div"
                                          value={issue.state}
                                          onChange={(data: string) => {
                                            partialUpdateIssue({ state: data }, issue.id);
                                          }}
                                          className="flex-shrink-0"
                                        >
                                          {({ open }) => (
                                            <>
                                              <div>
                                                <Listbox.Button
                                                  className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 border"
                                                  style={{
                                                    border: `2px solid ${issue.state_detail.color}`,
                                                    backgroundColor: `${issue.state_detail.color}20`,
                                                  }}
                                                >
                                                  <span
                                                    className={classNames(
                                                      issue.state ? "" : "text-gray-900",
                                                      "hidden capitalize sm:block w-16"
                                                    )}
                                                  >
                                                    {addSpaceIfCamelCase(issue.state_detail.name)}
                                                  </span>
                                                </Listbox.Button>

                                                <Transition
                                                  show={open}
                                                  as={React.Fragment}
                                                  leave="transition ease-in duration-100"
                                                  leaveFrom="opacity-100"
                                                  leaveTo="opacity-0"
                                                >
                                                  <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                                    {states?.map((state) => (
                                                      <Listbox.Option
                                                        key={state.id}
                                                        className={({ active }) =>
                                                          classNames(
                                                            active ? "bg-indigo-50" : "bg-white",
                                                            "cursor-pointer select-none px-3 py-2"
                                                          )
                                                        }
                                                        value={state.id}
                                                      >
                                                        {addSpaceIfCamelCase(state.name)}
                                                      </Listbox.Option>
                                                    ))}
                                                  </Listbox.Options>
                                                </Transition>
                                              </div>
                                            </>
                                          )}
                                        </Listbox>
                                      </td>
                                    ) : (key as keyof Properties) === "target_date" ? (
                                      <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                        {issue.target_date
                                          ? renderShortNumericDateFormat(issue.target_date)
                                          : "-"}
                                      </td>
                                    ) : (
                                      <td className="px-3 py-4 text-sm font-medium text-gray-900 relative capitalize">
                                        {issue[key as keyof IIssue] ??
                                          (issue[key as keyof IIssue] as any)?.name ??
                                          "None"}
                                      </td>
                                    )}
                                  </React.Fragment>
                                )
                            )}
                            <td className="px-3">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  type="button"
                                  className="flex items-center bg-blue-100 text-blue-600 hover:bg-blue-200 duration-300 font-medium px-2 py-1 rounded-md text-sm outline-none"
                                  onClick={() => {
                                    setSelectedIssue({
                                      ...issue,
                                      actionType: "edit",
                                    });
                                  }}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  className="flex items-center bg-red-100 text-red-600 hover:bg-red-200 duration-300 font-medium px-2 py-1 rounded-md text-sm outline-none"
                                  onClick={() => {
                                    handleDeleteIssue(issue.id);
                                  }}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListView;
