import React from "react";

import { useRouter } from "next/router";

// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useIssuesView from "hooks/use-issues-view";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// components
import { SelectFilters } from "components/views";
// ui
import { CustomMenu } from "components/ui";
// icons
import {
  ChevronDownIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { Properties } from "types";
// constants
import { GROUP_BY_OPTIONS, ORDER_BY_OPTIONS, FILTER_ISSUE_OPTIONS } from "constants/issue";
import useEstimateOption from "hooks/use-estimate-option";

export const IssuesFilterView: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, viewId } = router.query;

  const {
    issueView,
    setIssueView,
    groupByProperty,
    setGroupByProperty,
    orderBy,
    setOrderBy,
    showEmptyGroups,
    setShowEmptyGroups,
    filters,
    setFilters,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } = useIssuesView();

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  const { isEstimateActive } = useEstimateOption();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-x-1">
        <button
          type="button"
          className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-1 ${
            issueView === "list" ? "bg-brand-base" : ""
          }`}
          onClick={() => setIssueView("list")}
        >
          <ListBulletIcon className="h-4 w-4 text-brand-secondary" />
        </button>
        <button
          type="button"
          className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-base ${
            issueView === "kanban" ? "bg-brand-base" : ""
          }`}
          onClick={() => setIssueView("kanban")}
        >
          <Squares2X2Icon className="h-4 w-4 text-brand-secondary" />
        </button>
        <button
          type="button"
          className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-base ${
            issueView === "calendar" ? "bg-brand-base" : ""
          }`}
          onClick={() => setIssueView("calendar")}
        >
          <CalendarDaysIcon className="h-4 w-4 text-brand-secondary" />
        </button>
      </div>
      <SelectFilters
        filters={filters}
        onSelect={(option) => {
          const key = option.key as keyof typeof filters;

          const valueExists = filters[key]?.includes(option.value);

          if (valueExists) {
            setFilters(
              {
                ...(filters ?? {}),
                [option.key]: ((filters[key] ?? []) as any[])?.filter(
                  (val) => val !== option.value
                ),
              },
              !Boolean(viewId)
            );
          } else {
            setFilters(
              {
                ...(filters ?? {}),
                [option.key]: [...((filters[key] ?? []) as any[]), option.value],
              },
              !Boolean(viewId)
            );
          }
        }}
        direction="left"
        height="rg"
      />
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`group flex items-center gap-2 rounded-md border border-brand-base bg-transparent px-3 py-1.5 text-xs hover:bg-brand-surface-1 hover:text-brand-base focus:outline-none ${
                open ? "bg-brand-surface-1 text-brand-base" : "text-brand-secondary"
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
              <Popover.Panel className="absolute right-0 z-20 mt-1 w-screen max-w-xs transform overflow-hidden rounded-lg bg-brand-surface-2 p-3 shadow-lg">
                <div className="relative divide-y-2 divide-brand-base">
                  <div className="space-y-4 pb-3 text-xs">
                    {issueView !== "calendar" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-brand-secondary">Group by</h4>
                          <CustomMenu
                            label={
                              GROUP_BY_OPTIONS.find((option) => option.key === groupByProperty)
                                ?.name ?? "Select"
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
                          <h4 className="text-brand-secondary">Order by</h4>
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
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <h4 className="text-brand-secondary">Issue type</h4>
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

                    {issueView !== "calendar" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-brand-secondary">Show empty states</h4>
                          <button
                            type="button"
                            className={`relative inline-flex h-3.5 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              showEmptyGroups ? "bg-green-500" : "bg-brand-surface-2"
                            }`}
                            role="switch"
                            aria-checked={showEmptyGroups}
                            onClick={() => setShowEmptyGroups(!showEmptyGroups)}
                          >
                            <span className="sr-only">Show empty groups</span>
                            <span
                              aria-hidden="true"
                              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-brand-surface-2 shadow ring-0 transition duration-200 ease-in-out ${
                                showEmptyGroups ? "translate-x-2.5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="relative flex justify-end gap-x-3">
                          <button type="button" onClick={() => resetFilterToDefault()}>
                            Reset to default
                          </button>
                          <button
                            type="button"
                            className="font-medium text-brand-accent"
                            onClick={() => setNewFilterDefaultView()}
                          >
                            Set as default
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {issueView !== "calendar" && (
                    <div className="space-y-2 py-3">
                      <h4 className="text-sm text-brand-secondary">Display Properties</h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {Object.keys(properties).map((key) => {
                          if (key === "estimate" && !isEstimateActive) return null;

                          return (
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
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};
