import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// services
import issuesService from "services/issues.service";
import workspaceService from "services/workspace.service";
import stateService from "services/state.service";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// ui
import { CustomMenu, CustomSelect, AssigneesList, Avatar } from "components/ui";
// components
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
// icons
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortNumericDateFormat, findHowManyDaysLeft } from "helpers/date-time.helper";
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IWorkspaceMember, Properties, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_ISSUES,
  MODULE_ISSUES,
  PROJECT_ISSUES_LIST,
  STATE_LIST,
  WORKSPACE_MEMBERS,
} from "constants/fetch-keys";
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

type Props = {
  type?: string;
  typeId?: string;
  issue: IIssue;
  properties: Properties;
  editIssue: () => void;
  removeIssue?: () => void;
  userAuth: UserAuth;
};

const SingleListIssue: React.FC<Props> = ({
  type,
  typeId,
  issue,
  properties,
  editIssue,
  removeIssue,
  userAuth,
}) => {
  const [deleteIssue, setDeleteIssue] = useState<IIssue | undefined>();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: people } = useSWR<IWorkspaceMember[]>(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const partialUpdateIssue = (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId) return;

    issuesService
      .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData)
      .then((res) => {
        if (typeId) {
          mutate(CYCLE_ISSUES(typeId ?? ""));
          mutate(MODULE_ISSUES(typeId ?? ""));
        }

        mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={deleteIssue}
      />
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
            style={{
              backgroundColor: issue.state_detail.color,
            }}
          />
          <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
            <a className="group relative flex items-center gap-2">
              {properties.key && (
                <span className="flex-shrink-0 text-xs text-gray-500">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              )}
              <span>{issue.name}</span>
            </a>
          </Link>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          {properties.priority && (
            <Listbox
              as="div"
              value={issue.priority}
              onChange={(data: string) => {
                partialUpdateIssue({ priority: data });
              }}
              className="group relative flex-shrink-0"
              disabled={isNotAllowed}
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button
                      className={`flex ${
                        isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
                      } items-center gap-x-2 rounded px-2 py-0.5 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
                      {getPriorityIcon(
                        issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
                        "text-sm"
                      )}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 w-36 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {PRIORITIES?.map((priority) => (
                          <Listbox.Option
                            key={priority}
                            className={({ active }) =>
                              `flex cursor-pointer select-none items-center gap-x-2 px-3 py-2 capitalize ${
                                active ? "bg-indigo-50" : "bg-white"
                              }`
                            }
                            value={priority}
                          >
                            {getPriorityIcon(priority, "text-sm")}
                            {priority ?? "None"}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                    <h5 className="mb-1 font-medium text-gray-900">Priority</h5>
                    <div
                      className={`capitalize ${
                        issue.priority === "urgent"
                          ? "text-red-600"
                          : issue.priority === "high"
                          ? "text-orange-500"
                          : issue.priority === "medium"
                          ? "text-yellow-500"
                          : issue.priority === "low"
                          ? "text-green-500"
                          : ""
                      }`}
                    >
                      {issue.priority ?? "None"}
                    </div>
                  </div>
                </>
              )}
            </Listbox>
          )}
          {properties.state && (
            <CustomSelect
              label={
                <>
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: issue.state_detail.color,
                    }}
                  />
                  {addSpaceIfCamelCase(issue.state_detail.name)}
                </>
              }
              value={issue.state}
              onChange={(data: string) => {
                partialUpdateIssue({ state: data });
              }}
              maxHeight="md"
              noChevron
              disabled={isNotAllowed}
            >
              {states?.map((state) => (
                <CustomSelect.Option key={state.id} value={state.id}>
                  <>
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: state.color,
                      }}
                    />
                    {addSpaceIfCamelCase(state.name)}
                  </>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
          {properties.due_date && (
            <div
              className={`group group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                issue.target_date === null
                  ? ""
                  : issue.target_date < new Date().toISOString()
                  ? "text-red-600"
                  : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
              <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                <h5 className="mb-1 font-medium text-gray-900">Due date</h5>
                <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
                <div>
                  {issue.target_date &&
                    (issue.target_date < new Date().toISOString()
                      ? `Due date has passed by ${findHowManyDaysLeft(issue.target_date)} days`
                      : findHowManyDaysLeft(issue.target_date) <= 3
                      ? `Due date is in ${findHowManyDaysLeft(issue.target_date)} days`
                      : "Due date")}
                </div>
              </div>
            </div>
          )}
          {properties.sub_issue_count && (
            <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {issue.sub_issues_count} {issue.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
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

                partialUpdateIssue({ assignees_list: newData });
              }}
              className="group relative flex-shrink-0"
              disabled={isNotAllowed}
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button>
                      <div
                        className={`flex ${
                          isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
                        } items-center gap-1 text-xs`}
                      >
                        <AssigneesList userIds={issue.assignees ?? []} />
                      </div>
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {people?.map((person) => (
                          <Listbox.Option
                            key={person.id}
                            className={({ active, selected }) =>
                              `flex items-center gap-x-1 cursor-pointer select-none p-2 ${
                                active ? "bg-indigo-50" : ""
                              } ${
                                selected || issue.assignees?.includes(person.member.id)
                                  ? "bg-indigo-50 font-medium"
                                  : "font-normal"
                              }`
                            }
                            value={person.member.id}
                          >
                            <Avatar user={person.member} />
                            <p>
                              {person.member.first_name && person.member.first_name !== ""
                                ? person.member.first_name
                                : person.member.email}
                            </p>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                    <h5 className="mb-1 font-medium">Assigned to</h5>
                    <div>
                      {issue.assignee_details?.length > 0
                        ? issue.assignee_details.map((assignee) => assignee.first_name).join(", ")
                        : "No one"}
                    </div>
                  </div>
                </>
              )}
            </Listbox>
          )}
          {type && !isNotAllowed && (
            <CustomMenu width="auto" ellipsis>
              <CustomMenu.MenuItem onClick={editIssue}>Edit</CustomMenu.MenuItem>
              {type !== "issue" && (
                <CustomMenu.MenuItem onClick={removeIssue}>
                  <>Remove from {type}</>
                </CustomMenu.MenuItem>
              )}
              <CustomMenu.MenuItem onClick={() => setDeleteIssue(issue)}>
                Delete permanently
              </CustomMenu.MenuItem>
            </CustomMenu>
          )}
        </div>
      </div>
    </>
  );
};

export default SingleListIssue;
