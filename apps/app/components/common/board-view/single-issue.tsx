import React from "react";
// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// react-beautiful-dnd
import { DraggableStateSnapshot } from "react-beautiful-dnd";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// constants
import { TrashIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
// services
import issuesService from "services/issues.service";
import stateService from "services/state.service";
import projectService from "services/project.service";
// components
import { AssigneesList } from "components/ui/avatar";
// helpers
import { renderShortNumericDateFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IssueResponse, IUserLite, IWorkspaceMember, Properties } from "types";
// common
import { PRIORITIES } from "constants/";
import { PROJECT_ISSUES_LIST, STATE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
import { getPriorityIcon } from "constants/global";

type Props = {
  issue: IIssue;
  properties: Properties;
  snapshot?: DraggableStateSnapshot;
  assignees: Partial<IUserLite>[] | (Partial<IUserLite> | undefined)[];
  people: IWorkspaceMember[] | undefined;
  handleDeleteIssue?: React.Dispatch<React.SetStateAction<string | undefined>>;
  partialUpdateIssue: any;
};

const SingleBoardIssue: React.FC<Props> = ({
  issue,
  properties,
  snapshot,
  assignees,
  people,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: issues } = useSWR<IssueResponse>(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const totalChildren = issues?.results.filter((i) => i.parent === issue.id).length;

  return (
    <div
      className={`rounded border bg-white shadow-sm ${
        snapshot && snapshot.isDragging ? "border-theme bg-indigo-50 shadow-lg" : ""
      }`}
    >
      <div className="group/card relative select-none p-2">
        {handleDeleteIssue && (
          <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover/card:opacity-100">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded bg-white p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
              onClick={() => handleDeleteIssue(issue.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
          <a>
            {properties.key && (
              <div className="mb-2 text-xs font-medium text-gray-500">
                {projectDetails?.identifier}-{issue.sequence_id}
              </div>
            )}
            <h5
              className="mb-3 text-sm group-hover:text-theme"
              style={{ lineClamp: 3, WebkitLineClamp: 3 }}
            >
              {issue.name}
            </h5>
          </a>
        </Link>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          {properties.priority && (
            <Listbox
              as="div"
              value={issue.priority}
              onChange={(data: string) => {
                partialUpdateIssue({ priority: data }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button
                      className={`grid cursor-pointer place-items-center rounded px-2 py-1 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
                      {getPriorityIcon(issue?.priority ?? "None")}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {PRIORITIES?.map((priority) => (
                          <Listbox.Option
                            key={priority}
                            className={({ active }) =>
                              `flex cursor-pointer select-none items-center gap-2 px-3 py-2 capitalize ${
                                active ? "bg-indigo-50" : "bg-white"
                              }`
                            }
                            value={priority}
                          >
                            {getPriorityIcon(priority)}
                            {priority}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </>
              )}
            </Listbox>
          )}
          {properties.state && (
            <Listbox
              as="div"
              value={issue.state}
              onChange={(data: string) => {
                partialUpdateIssue({ state: data }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: issue.state_detail.color,
                        }}
                      />
                      {addSpaceIfCamelCase(issue.state_detail.name)}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {states?.map((state) => (
                          <Listbox.Option
                            key={state.id}
                            className={({ active }) =>
                              `flex cursor-pointer select-none items-center gap-2 px-3 py-2 ${
                                active ? "bg-indigo-50" : "bg-white"
                              }`
                            }
                            value={state.id}
                          >
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: state.color,
                              }}
                            />
                            {addSpaceIfCamelCase(state.name)}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  {/* <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1">State</h5>
                    <div>{issue.state_detail.name}</div>
                  </div> */}
                </>
              )}
            </Listbox>
          )}
          {properties.due_date && (
            <div
              className={`group flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                issue.target_date === null
                  ? ""
                  : issue.target_date < new Date().toISOString()
                  ? "text-red-600"
                  : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
            </div>
          )}
          {properties.sub_issue_count && (
            <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {totalChildren} {totalChildren === 1 ? "sub-issue" : "sub-issues"}
            </div>
          )}
          {properties.assignee && (
            <Listbox
              as="div"
              value={issue.assignees}
              onChange={(data: any) => {
                const newData = issue.assignees ?? [];

                if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
                else newData.push(data);

                partialUpdateIssue({ assignees_list: newData }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button>
                      <div className="flex cursor-pointer items-center gap-1 text-xs">
                        <AssigneesList users={assignees} length={3} />
                      </div>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute left-0 z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {people?.map((person) => (
                          <Listbox.Option
                            key={person.id}
                            className={({ active }) =>
                              `cursor-pointer select-none p-2 ${
                                active ? "bg-indigo-50" : "bg-white"
                              }`
                            }
                            value={person.member.id}
                          >
                            <div
                              className={`flex items-center gap-x-1 ${
                                assignees.includes({
                                  id: person.member.last_name,
                                  first_name: person.member.first_name,
                                  last_name: person.member.last_name,
                                  email: person.member.email,
                                  avatar: person.member.avatar,
                                })
                                  ? "font-medium"
                                  : "font-normal"
                              }`}
                            >
                              {person.member.avatar && person.member.avatar !== "" ? (
                                <div className="relative h-4 w-4">
                                  <Image
                                    src={person.member.avatar}
                                    alt="avatar"
                                    className="rounded-full"
                                    layout="fill"
                                    objectFit="cover"
                                    priority={false}
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="grid h-4 w-4 place-items-center rounded-full bg-gray-700 capitalize text-white">
                                  {person.member.first_name && person.member.first_name !== ""
                                    ? person.member.first_name.charAt(0)
                                    : person.member.email.charAt(0)}
                                </div>
                              )}
                              <p>
                                {person.member.first_name && person.member.first_name !== ""
                                  ? person.member.first_name
                                  : person.member.email}
                              </p>
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
        </div>
      </div>
    </div>
  );
};

export default SingleBoardIssue;
