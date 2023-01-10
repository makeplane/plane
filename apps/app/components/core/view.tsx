import React from "react";

import { useRouter } from "next/router";
// hooks
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { CustomMenu } from "ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, NestedKeyOf, Properties } from "types";
// common
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
// constants
import { filterIssueOptions, groupByOptions, orderByOptions } from "constants/";

type Props = {
  groupByProperty: NestedKeyOf<IIssue> | null;
  setGroupByProperty: (property: NestedKeyOf<IIssue> | null) => void;
  orderBy: NestedKeyOf<IIssue> | null;
  setOrderBy: (property: NestedKeyOf<IIssue> | null) => void;
  filterIssue: "activeIssue" | "backlogIssue" | null;
  setFilterIssue: (property: "activeIssue" | "backlogIssue" | null) => void;
  resetFilterToDefault: () => void;
  setNewFilterDefaultView: () => void;
};

const View: React.FC<Props> = ({
  groupByProperty,
  setGroupByProperty,
  orderBy,
  setOrderBy,
  filterIssue,
  setFilterIssue,
  resetFilterToDefault,
  setNewFilterDefaultView,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties, setProperties] = useIssuesProperties(
    workspaceSlug as string,
    projectId as string
  );

  return (
    <>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={classNames(
                open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                "group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
              )}
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
                  <div className="space-y-4 pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm text-gray-600">Group by</h4>
                      <CustomMenu
                        label={
                          groupByOptions.find((option) => option.key === groupByProperty)?.name ??
                          "Select"
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
                          orderByOptions.find((option) => option.key === orderBy)?.name ?? "Select"
                        }
                        width="lg"
                      >
                        {orderByOptions.map((option) =>
                          groupByProperty === "priority" && option.key === "priority" ? null : (
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
                          filterIssueOptions.find((option) => option.key === filterIssue)?.name ??
                          "Select"
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
    </>
  );
};

export default View;
