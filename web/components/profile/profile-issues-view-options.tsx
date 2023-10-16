import React from "react";

import { useRouter } from "next/router";

// headless ui
import { Popover, Transition } from "@headlessui/react";
// hooks
import useProfileIssues from "hooks/use-profile-issues";
import useEstimateOption from "hooks/use-estimate-option";
// components
import { MyIssuesSelectFilters } from "components/issues";
// ui
import { CustomMenu } from "components/ui";
import { ToggleSwitch, Tooltip } from "@plane/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { FormatListBulletedOutlined, GridViewOutlined } from "@mui/icons-material";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { Properties, TIssueLayouts } from "types";
// constants
import { ISSUE_GROUP_BY_OPTIONS, ISSUE_ORDER_BY_OPTIONS, ISSUE_FILTER_OPTIONS } from "constants/issue";

const issueViewOptions: { type: TIssueLayouts; Icon: any }[] = [
  {
    type: "list",
    Icon: FormatListBulletedOutlined,
  },
  {
    type: "kanban",
    Icon: GridViewOutlined,
  },
];

export const ProfileIssuesViewOptions: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query;

  const { displayFilters, setDisplayFilters, filters, displayProperties, setProperties, setFilters } = useProfileIssues(
    workspaceSlug?.toString(),
    userId?.toString()
  );

  const { isEstimateActive } = useEstimateOption();

  if (
    !router.pathname.includes("assigned") &&
    !router.pathname.includes("created") &&
    !router.pathname.includes("subscribed")
  )
    return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-x-1">
        {issueViewOptions.map((option) => (
          <Tooltip
            key={option.type}
            tooltipContent={<span className="capitalize">{replaceUnderscoreIfSnakeCase(option.type)} Layout</span>}
            position="bottom"
          >
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80 duration-300 ${
                displayFilters?.layout === option.type
                  ? "bg-custom-sidebar-background-80"
                  : "text-custom-sidebar-text-200"
              }`}
              onClick={() => setDisplayFilters({ layout: option.type })}
            >
              <option.Icon
                sx={{
                  fontSize: 16,
                }}
                className={option.type === "gantt_chart" ? "rotate-90" : ""}
              />
            </button>
          </Tooltip>
        ))}
      </div>
      <MyIssuesSelectFilters
        filters={filters}
        onSelect={(option) => {
          const key = option.key as keyof typeof filters;

          if (key === "start_date" || key === "target_date") {
            const valueExists = checkIfArraysHaveSameElements(filters?.[key] ?? [], option.value);

            setFilters({
              [key]: valueExists ? null : option.value,
            });
          } else {
            const valueExists = filters[key]?.includes(option.value);

            if (valueExists)
              setFilters({
                [option.key]: ((filters[key] ?? []) as any[])?.filter((val) => val !== option.value),
              });
            else
              setFilters({
                [option.key]: [...((filters[key] ?? []) as any[]), option.value],
              });
          }
        }}
        direction="left"
        height="rg"
      />
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`group flex items-center gap-2 rounded-md border border-custom-border-200 bg-transparent px-3 py-1.5 text-xs hover:bg-custom-sidebar-background-90 hover:text-custom-sidebar-text-100 focus:outline-none duration-300 ${
                open ? "bg-custom-sidebar-background-90 text-custom-sidebar-text-100" : "text-custom-sidebar-text-200"
              }`}
            >
              Display
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
              <Popover.Panel className="absolute right-0 z-30 mt-1 w-screen max-w-xs transform rounded-lg border border-custom-border-200 bg-custom-background-90 p-3 shadow-lg">
                <div className="relative divide-y-2 divide-custom-border-200">
                  <div className="space-y-4 pb-3 text-xs">
                    {displayFilters?.layout !== "calendar" && displayFilters?.layout !== "spreadsheet" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-custom-text-200">Group by</h4>
                          <div className="w-28">
                            <CustomMenu
                              label={
                                displayFilters?.group_by === "project"
                                  ? "Project"
                                  : ISSUE_GROUP_BY_OPTIONS.find((option) => option.key === displayFilters?.group_by)
                                      ?.title ?? "Select"
                              }
                              className="!w-full"
                              buttonClassName="w-full"
                            >
                              {ISSUE_GROUP_BY_OPTIONS.map((option) => {
                                if (displayFilters?.layout === "kanban" && option.key === null) return null;
                                if (option.key === "state" || option.key === "created_by" || option.key === "assignees")
                                  return null;

                                return (
                                  <CustomMenu.MenuItem
                                    key={option.key}
                                    onClick={() => setDisplayFilters({ group_by: option.key })}
                                  >
                                    {option.title}
                                  </CustomMenu.MenuItem>
                                );
                              })}
                            </CustomMenu>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-custom-text-200">Order by</h4>
                          <div className="w-28">
                            <CustomMenu
                              label={
                                ISSUE_ORDER_BY_OPTIONS.find((option) => option.key === displayFilters?.order_by)
                                  ?.title ?? "Select"
                              }
                              className="!w-full"
                              buttonClassName="w-full"
                            >
                              {ISSUE_ORDER_BY_OPTIONS.map((option) => {
                                if (displayFilters?.group_by === "priority" && option.key === "priority") return null;
                                if (option.key === "sort_order") return null;

                                return (
                                  <CustomMenu.MenuItem
                                    key={option.key}
                                    onClick={() => {
                                      setDisplayFilters({ order_by: option.key });
                                    }}
                                  >
                                    {option.title}
                                  </CustomMenu.MenuItem>
                                );
                              })}
                            </CustomMenu>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <h4 className="text-custom-text-200">Issue type</h4>
                      <div className="w-28">
                        <CustomMenu
                          label={
                            <span className="truncate">
                              {ISSUE_FILTER_OPTIONS.find((option) => option.key === displayFilters?.type)?.title ??
                                "Select"}
                            </span>
                          }
                          className="!w-full"
                          buttonClassName="w-full"
                        >
                          {ISSUE_FILTER_OPTIONS.map((option) => (
                            <CustomMenu.MenuItem
                              key={option.key}
                              onClick={() =>
                                setDisplayFilters({
                                  type: option.key,
                                })
                              }
                            >
                              {option.title}
                            </CustomMenu.MenuItem>
                          ))}
                        </CustomMenu>
                      </div>
                    </div>

                    {displayFilters?.layout !== "calendar" && displayFilters?.layout !== "spreadsheet" && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-custom-text-200">Show empty states</h4>
                          <div className="w-28">
                            <ToggleSwitch
                              value={displayFilters?.show_empty_groups ?? true}
                              onChange={() =>
                                setDisplayFilters({
                                  show_empty_groups: !displayFilters?.show_empty_groups,
                                })
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 py-3">
                    <h4 className="text-sm text-custom-text-200">Display Properties</h4>
                    <div className="flex flex-wrap items-center gap-2 text-custom-text-200">
                      {displayProperties &&
                        Object.keys(displayProperties).map((key) => {
                          if (key === "estimate" && !isEstimateActive) return null;

                          if (
                            displayFilters?.layout === "spreadsheet" &&
                            (key === "attachment_count" || key === "link" || key === "sub_issue_count")
                          )
                            return null;

                          if (
                            displayFilters?.layout !== "spreadsheet" &&
                            (key === "created_on" || key === "updated_on")
                          )
                            return null;

                          return (
                            <button
                              key={key}
                              type="button"
                              className={`rounded border px-2 py-1 text-xs capitalize ${
                                displayProperties[key as keyof Properties]
                                  ? "border-custom-primary bg-custom-primary text-white"
                                  : "border-custom-border-200"
                              }`}
                              onClick={() => setProperties(key as keyof Properties)}
                            >
                              {key === "key" ? "ID" : replaceUnderscoreIfSnakeCase(key)}
                            </button>
                          );
                        })}
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
