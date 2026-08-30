/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { PillButton } from "@makeplane/propel/components/pill";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { EHeaderVariant, Header } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// local imports
import { AppliedAccessFilters } from "./access";
import { AppliedDateFilters } from "./date";
import { AppliedMembersFilters } from "./members";
import { AppliedProjectDisplayFilters } from "./project-display-filters";

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

export function ProjectAppliedFiltersList(props: Props) {
  const { t } = useTranslation();
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
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem>
        {/* Applied filters */}
        {Object.entries(appliedFilters ?? {}).map(([key, value]) => {
          const filterKey = key as keyof TProjectFilters;

          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;

          return (
            <div
              key={filterKey}
              className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-11 text-tertiary capitalize hover:text-secondary"
            >
              <span className="text-11 text-tertiary">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
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
                  className="grid place-items-center text-tertiary hover:text-secondary"
                  onClick={() => handleRemoveFilter(filterKey, null)}
                >
                  <CloseIcon height={12} width={12} strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}
        {/* Applied display filters */}
        {appliedDisplayFilters.length > 0 && (
          <div
            key="project_display_filters"
            className="my-auto flex min-h-9 cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-subtle p-1.5 text-11 text-tertiary capitalize hover:text-secondary"
          >
            <span className="text-11 text-tertiary">{t("common.projects")}</span>
            <AppliedProjectDisplayFilters
              editable={isEditingAllowed}
              values={appliedDisplayFilters}
              handleRemove={(key) => handleRemoveDisplayFilter(key)}
            />
          </div>
        )}
        {isEditingAllowed && (
          <PillButton
            type="button"
            size="md"
            variant="outline"
            label={t("common.clear_all")}
            endIcon={<CloseIcon height={12} width={12} strokeWidth={2} />}
            onClick={handleClearAllFilters}
          />
        )}
      </Header.LeftItem>
      <Header.RightItem>
        <Tooltip
          tooltipContent={
            <p>
              <span className="font-semibold">{filteredProjects}</span> of{" "}
              <span className="font-semibold">{totalProjects}</span> projects match the applied filters.
            </p>
          }
        >
          <span className="rounded-full bg-layer-1 px-2.5 py-1 text-13 font-medium">
            {filteredProjects}/{totalProjects}
          </span>
        </Tooltip>
      </Header.RightItem>
    </Header>
  );
}
