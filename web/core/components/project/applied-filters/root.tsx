"use client";

import { X } from "lucide-react";
// types
import { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
// ui
import { Tag, Tooltip } from "@plane/ui";
// components
import {
  AppliedAccessFilters,
  AppliedDateFilters,
  AppliedMembersFilters,
  AppliedProjectDisplayFilters,
} from "@/components/project";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";

type Props = {
  appliedFilters: TProjectFilters;
  appliedDisplayFilters: TProjectAppliedDisplayFilterKeys[];
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TProjectFilters, value: string | null) => void;
  handleRemoveDisplayFilter: (key: TProjectAppliedDisplayFilterKeys) => void;
  alwaysAllowEditing?: boolean;
  filteredProjects: number;
  totalProjects: number;
};

const MEMBERS_FILTERS = ["lead", "members"];
const DATE_FILTERS = ["created_at"];

export const ProjectAppliedFiltersList: React.FC<Props> = (props) => {
  const {
    appliedFilters,
    appliedDisplayFilters,
    handleClearAllFilters,
    handleRemoveFilter,
    handleRemoveDisplayFilter,
    alwaysAllowEditing,
    filteredProjects,
    totalProjects,
  } = props;

  if (!appliedFilters && !appliedDisplayFilters) return null;
  if (Object.keys(appliedFilters).length === 0 && appliedDisplayFilters.length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex items-start justify-between gap-1.5 my-auto w-full">
      <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
        {/* Applied filters */}
        {Object.entries(appliedFilters ?? {}).map(([key, value]) => {
          const filterKey = key as keyof TProjectFilters;

          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;

          return (
            <Tag key={filterKey}>
              <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
              {filterKey === "access" && (
                <AppliedAccessFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter("access", val)}
                  values={value}
                />
              )}
              {DATE_FILTERS.includes(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={value}
                />
              )}
              {MEMBERS_FILTERS.includes(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={value}
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
        {/* Applied display filters */}
        {appliedDisplayFilters.length > 0 && (
          <Tag key="project_display_filters">
            <span className="text-xs text-custom-text-300">Projects</span>
            <AppliedProjectDisplayFilters
              editable={isEditingAllowed}
              values={appliedDisplayFilters}
              handleRemove={(key) => handleRemoveDisplayFilter(key)}
            />
          </Tag>
        )}
        {isEditingAllowed && (
          <button type="button" onClick={handleClearAllFilters}>
            <Tag>
              Clear all
              <X size={12} strokeWidth={2} />
            </Tag>
          </button>
        )}
      </div>
      <Tooltip
        tooltipContent={
          <p>
            <span className="font-semibold">{filteredProjects}</span> of{" "}
            <span className="font-semibold">{totalProjects}</span> projects match the applied filters.
          </p>
        }
      >
        <span className="bg-custom-background-80 rounded-full text-sm font-medium py-1 px-2.5 my-auto">
          {filteredProjects}/{totalProjects}
        </span>
      </Tooltip>
    </div>
  );
};
