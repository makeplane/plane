"use client";

import { X } from "lucide-react";
// ui
import { EHeaderVariant, Header, Tag, Tooltip } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase  } from "@plane/utils";
import { TProjectFilters, TProjectAttributes } from "@/plane-web/types/workspace-project-filters";
import { EProjectAccess, EProjectPriority } from "@/plane-web/types/workspace-project-states";
import { AppliedAccessFilters, AppliedMembersFilters, AppliedPriorityFilters, AppliedStateFilters } from "./index";
type Props = {
  appliedFilters: TProjectFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: <T extends keyof TProjectAttributes>(key: T, values: any) => void;
  alwaysAllowEditing?: boolean;
  filteredProjects: number;
  totalProjects: number;
};

export const ProjectAppliedFiltersList: React.FC<Props> = (props) => {
  const {
    appliedFilters,
    handleClearAllFilters,
    alwaysAllowEditing,
    filteredProjects,
    totalProjects,
    handleRemoveFilter,
  } = props;

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem>
        {/* Applied filters */}
        {Object.entries(appliedFilters.attributes ?? {}).map(([key, value]) => {
          const filterKey = key as keyof TProjectAttributes;
          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;
          if (filterKey !== "archived")
            return (
              <Tag key={filterKey}>
                <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
                {filterKey === "access" && (
                  <AppliedAccessFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("access", val)}
                    appliedFilters={value as EProjectAccess[]}
                  />
                )}
                {filterKey === "state" && (
                  <AppliedStateFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("state", val)}
                    appliedFilters={value as string[]}
                  />
                )}
                {filterKey === "priority" && (
                  <AppliedPriorityFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("priority", val)}
                    appliedFilters={value as EProjectPriority[]}
                  />
                )}

                {filterKey === "lead" && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("lead", val)}
                    appliedFilters={value as string[]}
                  />
                )}

                {filterKey === "members" && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("members", val)}
                    appliedFilters={value as string[]}
                  />
                )}
                {isEditingAllowed && (
                  <button
                    type="button"
                    className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                    onClick={() => handleRemoveFilter(filterKey, null)}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </Tag>
            );
        })}
        {isEditingAllowed && (
          <button type="button" onClick={handleClearAllFilters}>
            <Tag>
              Clear all
              <X size={12} strokeWidth={2} />
            </Tag>
          </button>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        <Tooltip
          tooltipContent={
            <p>
              <span className="font-semibold">{filteredProjects}</span> of{" "}
              <span className="font-semibold">{totalProjects}</span>
            </p>
          }
        >
          <span className="bg-custom-background-80 rounded-full text-sm font-medium py-1 px-2.5">
            {filteredProjects}/{totalProjects}
          </span>
        </Tooltip>
      </Header.RightItem>
    </Header>
  );
};
