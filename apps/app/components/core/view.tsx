import React from "react";

import { useRouter } from "next/router";

// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useIssueView from "hooks/use-issue-view";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { CustomMenu } from "components/ui";
// icons
import { ChevronDownIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { Squares2X2Icon } from "@heroicons/react/20/solid";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { IIssue, Properties } from "types";
// common
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";

type Props = {
  issues?: IIssue[];
};

export const IssuesFilterView: React.FC<Props> = ({ issues }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueView,
    setIssueViewToList,
    setIssueViewToKanban,
    groupByProperty,
    setGroupByProperty,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } = useIssueView(issues ?? []);

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  return (
    <>
      {issues && issues.length > 0 && (
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
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none ${
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500"
                  }`}
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
                  <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                    <div className="relative divide-y-2">
                      {issues && (
                        <div className="space-y-4 pb-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm text-gray-600">Group by</h4>
                            <CustomMenu
                              label={
                                groupByOptions.find((option) => option.key === groupByProperty)
                                  ?.name ?? "Select"
                              }
                              width="lg"
                            >
                              {groupByOptions.map((option) => (
                                <CustomMenu.MenuItem
                                  key={option.key}
                                  onClick={() => setGroupByProperty(option.key)}
                                >
                                  {option.name}
                                </CustomMenu.MenuItem>
                              ))}
                            </CustomMenu>
                          </div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm text-gray-600">Order by</h4>
                            <CustomMenu
                              label={
                                orderByOptions.find((option) => option.key === orderBy)?.name ??
                                "Select"
                              }
                              width="lg"
                            >
                              {orderByOptions.map((option) =>
                                groupByProperty === "priority" &&
                                option.key === "priority" ? null : (
                                  <CustomMenu.MenuItem
                                    key={option.key}
                                    onClick={() => setOrderBy(option.key)}
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
                                filterIssueOptions.find((option) => option.key === filterIssue)
                                  ?.name ?? "Select"
                              }
                              width="lg"
                            >
                              {filterIssueOptions.map((option) => (
                                <CustomMenu.MenuItem
                                  key={option.key}
                                  onClick={() => setFilterIssue(option.key)}
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
                      )}
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
        </div>
      )}
    </>
  );
};
