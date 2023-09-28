import React from "react";

import { useRouter } from "next/router";

// hooks
import { useWorkspaceView } from "hooks/use-workspace-view";
// components
import { GlobalSelectFilters } from "components/workspace/views/global-select-filters";
// ui
import { Tooltip } from "components/ui";
// icons
import { FormatListBulletedOutlined } from "@mui/icons-material";
import { CreditCard } from "lucide-react";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { TIssueViewOptions } from "types";

const issueViewOptions: { type: TIssueViewOptions; Icon: any }[] = [
  {
    type: "list",
    Icon: FormatListBulletedOutlined,
  },
  {
    type: "spreadsheet",
    Icon: CreditCard,
  },
];

export const WorkspaceIssuesViewOptions: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const { filters, handleFilters } = useWorkspaceView();

  const isWorkspaceViewPath = router.pathname.includes("workspace-views/all-issues");

  const showFilters = isWorkspaceViewPath || workspaceViewId;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-x- px-1 py-0.5 rounded bg-custom-sidebar-background-90 ">
        {issueViewOptions.map((option) => (
          <Tooltip
            key={option.type}
            tooltipContent={
              <span className="capitalize">{replaceUnderscoreIfSnakeCase(option.type)} View</span>
            }
            position="bottom"
          >
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-100 duration-300 ${
                filters.display_filters?.layout === option.type
                  ? "bg-custom-sidebar-background-100 shadow-sm"
                  : "text-custom-sidebar-text-200"
              }`}
              onClick={() => {
                handleFilters("display_filters", { layout: option.type }, true);
                if (option.type === "spreadsheet")
                  router.push(`/${workspaceSlug}/workspace-views/all-issues`);
                else router.push(`/${workspaceSlug}/workspace-views`);
              }}
            >
              <option.Icon
                sx={{
                  fontSize: 16,
                }}
                className={option.type === "spreadsheet" ? "h-4 w-4" : ""}
              />
            </button>
          </Tooltip>
        ))}
      </div>

      {showFilters && (
        <>
          <GlobalSelectFilters
            filters={filters.filters}
            onSelect={(option) => {
              const key = option.key as keyof typeof filters.filters;

              if (key === "start_date" || key === "target_date") {
                const valueExists = checkIfArraysHaveSameElements(
                  filters.filters?.[key] ?? [],
                  option.value
                );

                handleFilters("filters", {
                  ...filters,
                  [key]: valueExists ? null : option.value,
                });
              } else {
                if (!filters?.filters?.[key]?.includes(option.value))
                  handleFilters("filters", {
                    ...filters,
                    [key]: [...((filters?.filters?.[key] as any[]) ?? []), option.value],
                  });
                else {
                  handleFilters("filters", {
                    ...filters,
                    [key]: (filters?.filters?.[key] as any[])?.filter(
                      (item) => item !== option.value
                    ),
                  });
                }
              }
            }}
            direction="left"
          />
        </>
      )}
    </div>
  );
};
