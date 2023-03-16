import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import issuesService from "services/issues.service";
import stateService from "services/state.service";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useIssuesView from "hooks/use-issues-view";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// components
import { PRIORITIES } from "constants/project";
// ui
import { Avatar, CustomMenu, MultiLevelDropdown } from "components/ui";
// icons
import { ChevronDownIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
import { getStateGroupIcon } from "components/icons";
import { getPriorityIcon } from "components/icons/priority-icon";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { getStatesList } from "helpers/state.helper";
// types
import { IIssueLabels, Properties } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS, STATE_LIST } from "constants/fetch-keys";
// constants
import { GROUP_BY_OPTIONS, ORDER_BY_OPTIONS, FILTER_ISSUE_OPTIONS } from "constants/issue";

export const IssuesFilterView: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueView,
    setIssueViewToList,
    setIssueViewToKanban,
    groupByProperty,
    setGroupByProperty,
    setOrderBy,
    orderBy,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } = useIssuesView();

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const statesList = getStatesList(states ?? {});

  const { data: members } = useSWR(
    projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-x-1">
        <button
          type="button"
          className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
            issueView === "list" ? "bg-gray-200" : ""
          }`}
          onClick={() => setIssueViewToList()}
        >
          <ListBulletIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
            issueView === "kanban" ? "bg-gray-200" : ""
          }`}
          onClick={() => setIssueViewToKanban()}
        >
          <Squares2X2Icon className="h-4 w-4" />
        </button>
      </div>
      <MultiLevelDropdown
        label="Filters"
        onSelect={(option) => {
          setFilters({
            ...filters,
            [option.key]: [
              ...((filters?.[option.key as keyof typeof filters] as any[]) ?? []),
              option.value,
            ],
          });
        }}
        direction="left"
        options={[
          {
            id: "priority",
            label: "Priority",
            value: PRIORITIES,
            children: [
              ...PRIORITIES.map((priority) => ({
                id: priority ?? "none",
                label: (
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(priority)} {priority ?? "None"}
                  </div>
                ),
                value: {
                  key: "priority",
                  value: priority,
                },
                selected: filters?.priority?.includes(priority ?? "none"),
              })),
            ],
          },
          {
            id: "state",
            label: "State",
            value: statesList,
            children: [
              ...statesList.map((state) => ({
                id: state.id,
                label: (
                  <div className="flex items-center gap-2">
                    {getStateGroupIcon(state.group, "16", "16", state.color)} {state.name}
                  </div>
                ),
                value: {
                  key: "state",
                  value: state.id,
                },
                selected: filters?.state?.includes(state.id),
              })),
            ],
          },
          {
            id: "assignee",
            label: "Assignee",
            value: members,
            children: [
              ...(members?.map((member) => ({
                id: member.member.id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar user={member.member} />
                    {member.member.first_name && member.member.first_name !== ""
                      ? member.member.first_name
                      : member.member.email}
                  </div>
                ),
                value: {
                  key: "assignee",
                  value: member.member.id,
                },
                selected: filters?.assignees?.includes(member.member.id),
              })) ?? []),
            ],
          },
        ]}
      />
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`group flex items-center gap-2 rounded-md border bg-transparent px-3 py-1.5 text-xs hover:bg-gray-100 hover:text-gray-900 focus:outline-none ${
                open ? "bg-gray-100 text-gray-900" : "text-gray-500"
              }`}
            >
              View
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
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
              <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                <div className="relative divide-y-2">
                  <div className="space-y-4 pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-600">Group by</h4>
                      <CustomMenu
                        label={
                          GROUP_BY_OPTIONS.find((option) => option.key === groupByProperty)?.name ??
                          "Select"
                        }
                        width="lg"
                      >
                        {GROUP_BY_OPTIONS.map((option) =>
                          issueView === "kanban" && option.key === null ? null : (
                            <CustomMenu.MenuItem
                              key={option.key}
                              onClick={() => setGroupByProperty(option.key)}
                            >
                              {option.name}
                            </CustomMenu.MenuItem>
                          )
                        )}
                      </CustomMenu>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-600">Order by</h4>
                      <CustomMenu
                        label={
                          ORDER_BY_OPTIONS.find((option) => option.key === orderBy)?.name ??
                          "Select"
                        }
                        width="lg"
                      >
                        {ORDER_BY_OPTIONS.map((option) =>
                          groupByProperty === "priority" && option.key === "priority" ? null : (
                            <CustomMenu.MenuItem
                              key={option.key}
                              onClick={() => {
                                setOrderBy(option.key);
                              }}
                            >
                              {option.name}
                            </CustomMenu.MenuItem>
                          )
                        )}
                      </CustomMenu>
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-600">Issue type</h4>
                      <CustomMenu
                        label={
                          FILTER_ISSUE_OPTIONS.find((option) => option.key === filters.type)
                            ?.name ?? "Select"
                        }
                        width="lg"
                      >
                        {FILTER_ISSUE_OPTIONS.map((option) => (
                          <CustomMenu.MenuItem
                            key={option.key}
                            onClick={() =>
                              setFilters({
                                type: option.key,
                              })
                            }
                          >
                            {option.name}
                          </CustomMenu.MenuItem>
                        ))}
                      </CustomMenu>
                    </div>
                    <div className="relative flex justify-end gap-x-3">
                      <button
                        type="button"
                        className="text-xs"
                        onClick={() => resetFilterToDefault()}
                      >
                        Reset to default
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-theme"
                        onClick={() => setNewFilterDefaultView()}
                      >
                        Set as default
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 py-3">
                    <h4 className="text-sm text-gray-600">Display Properties</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.keys(properties).map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={`rounded border px-2 py-1 text-xs capitalize ${
                            properties[key as keyof Properties]
                              ? "border-theme bg-theme text-white"
                              : "border-gray-300"
                          }`}
                          onClick={() => setProperties(key as keyof Properties)}
                        >
                          {key === "key" ? "ID" : replaceUnderscoreIfSnakeCase(key)}
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
    </div>
  );
};
