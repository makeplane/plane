/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline } from "@makeplane/propel/icons";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { EHeaderVariant, Header } from "@plane/blocks/layout";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
// local imports
import { AppliedAccessFilters } from "./access";
import { AppliedDateFilters } from "./date";
import { AppliedMembersFilters } from "./members";
import { AppliedProjectDisplayFilters } from "./project-display-filters";
import { APPLIED_FILTER_GROUP_CLASSNAME } from "@/components/common/removable-chip";

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

const MEMBERS_FILTERS = new Set(["lead", "members"]);
const DATE_FILTERS = new Set(["created_at"]);

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

          const filterLabel = replaceUnderscoreIfSnakeCase(filterKey);

          return (
            <div key={filterKey} className={APPLIED_FILTER_GROUP_CLASSNAME}>
              <span className="text-caption-sm-regular text-tertiary capitalize">{filterLabel}</span>
              <div className="flex flex-wrap items-center gap-1">
                {filterKey === "access" && (
                  <AppliedAccessFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("access", val)}
                    values={value}
                  />
                )}
                {DATE_FILTERS.has(filterKey) && (
                  <AppliedDateFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                    values={value}
                  />
                )}
                {MEMBERS_FILTERS.has(filterKey) && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                    values={value}
                  />
                )}
                {isEditingAllowed && (
                  <IconButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-label={`${t("aria_labels.common.remove")}: ${filterLabel}`}
                    onClick={() => handleRemoveFilter(filterKey, null)}
                    icon={<Icon icon={CloseOutline} />}
                  />
                )}
              </div>
            </div>
          );
        })}
        {/* Applied display filters */}
        {appliedDisplayFilters.length > 0 && (
          <div key="project_display_filters" className={APPLIED_FILTER_GROUP_CLASSNAME}>
            <span className="text-caption-sm-regular text-tertiary">{t("common.projects")}</span>
            <div className="flex flex-wrap items-center gap-1">
              <AppliedProjectDisplayFilters
                editable={isEditingAllowed}
                values={appliedDisplayFilters}
                handleRemove={(key) => handleRemoveDisplayFilter(key)}
              />
            </div>
          </div>
        )}
        {isEditingAllowed && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            stretch="auto"
            label={t("common.clear_all")}
            onClick={handleClearAllFilters}
          />
        )}
      </Header.LeftItem>
      <Header.RightItem>
        <Tooltip label={`${filteredProjects} of ${totalProjects} projects match the applied filters.`} layout="stacked">
          <span className="rounded-full bg-layer-1 px-2.5 py-1 text-body-xs-medium">
            {filteredProjects}/{totalProjects}
          </span>
        </Tooltip>
      </Header.RightItem>
    </Header>
  );
}
