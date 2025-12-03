import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TProjectAppliedDisplayFilterKeys, TProjectFilters } from "@plane/types";
import { EHeaderVariant, Header, Tag } from "@plane/ui";
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
            <Tag key={filterKey}>
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
            </Tag>
          );
        })}
        {/* Applied display filters */}
        {appliedDisplayFilters.length > 0 && (
          <Tag key="project_display_filters">
            <span className="text-11 text-tertiary">{t("projects.label", { count: 2 })}</span>
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
              {t("common.clear_all")}
              <CloseIcon height={12} width={12} strokeWidth={2} />
            </Tag>
          </button>
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
          <span className="bg-layer-1 rounded-full text-13 font-medium py-1 px-2.5">
            {filteredProjects}/{totalProjects}
          </span>
        </Tooltip>
      </Header.RightItem>
    </Header>
  );
}
