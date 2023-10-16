import React from "react";

import { useRouter } from "next/router";

// hooks
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
// components
import { MyIssuesSelectFilters } from "components/issues";
// ui
import { Tooltip } from "@plane/ui";
// icons
import { FormatListBulletedOutlined } from "@mui/icons-material";
import { CreditCard } from "lucide-react";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { checkIfArraysHaveSameElements } from "helpers/array.helper";
// types
import { TIssueLayouts } from "types";

const issueViewOptions: { type: TIssueLayouts; Icon: any }[] = [
  {
    type: "list",
    Icon: FormatListBulletedOutlined,
  },
  {
    type: "spreadsheet",
    Icon: CreditCard,
  },
];

export const MyIssuesViewOptions: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;

  const { displayFilters, setDisplayFilters, filters, setFilters } = useMyIssuesFilters(workspaceSlug?.toString());

  const workspaceViewPathName = ["workspace-views/all-issues"];

  const isWorkspaceViewPath = workspaceViewPathName.some((pathname) => router.pathname.includes(pathname));

  const showFilters = isWorkspaceViewPath || globalViewId;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-x-1">
        {issueViewOptions.map((option) => (
          <Tooltip
            key={option.type}
            tooltipContent={<span className="capitalize">{replaceUnderscoreIfSnakeCase(option.type)} View</span>}
            position="bottom"
          >
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-100 duration-300 ${
                displayFilters?.layout === option.type
                  ? "bg-custom-sidebar-background-100 shadow-sm"
                  : "text-custom-sidebar-text-200"
              }`}
              onClick={() => {
                setDisplayFilters({ layout: option.type });
                if (option.type === "spreadsheet") router.push(`/${workspaceSlug}/workspace-views/all-issues`);
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
      )}
    </div>
  );
};
