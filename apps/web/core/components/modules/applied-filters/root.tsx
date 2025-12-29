import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import type { TModuleDisplayFilters, TModuleFilters } from "@plane/types";
// components
import { Header, EHeaderVariant, Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import { AppliedDateFilters, AppliedMembersFilters, AppliedStatusFilters } from "@/components/modules";
// helpers
// types

type Props = {
  appliedFilters: TModuleFilters;
  isFavoriteFilterApplied?: boolean;
  handleClearAllFilters: () => void;
  handleDisplayFiltersUpdate?: (updatedDisplayProperties: Partial<TModuleDisplayFilters>) => void;
  handleRemoveFilter: (key: keyof TModuleFilters, value: string | null) => void;
  alwaysAllowEditing?: boolean;
  isArchived?: boolean;
};

const MEMBERS_FILTERS = ["lead", "members"];
const DATE_FILTERS = ["start_date", "target_date"];

export function ModuleAppliedFiltersList(props: Props) {
  const {
    appliedFilters,
    isFavoriteFilterApplied,
    handleClearAllFilters,
    handleRemoveFilter,
    handleDisplayFiltersUpdate,
    alwaysAllowEditing,
    isArchived = false,
  } = props;
  const { t } = useTranslation();

  if (!appliedFilters && !isFavoriteFilterApplied) return null;
  if (Object.keys(appliedFilters).length === 0 && !isFavoriteFilterApplied) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <div className="flex gap-2 flex-wrap">
        {Object.entries(appliedFilters).map(([key, value]) => {
          const filterKey = key as keyof TModuleFilters;

          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;

          return (
            <Tag key={filterKey}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-11 text-tertiary">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
                {filterKey === "status" && (
                  <AppliedStatusFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("status", val)}
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
            </Tag>
          );
        })}
        {!isArchived && isFavoriteFilterApplied && (
          <div
            key="module_display_filters"
            className="flex flex-wrap items-center gap-2 rounded-md border border-subtle px-2 py-1 capitalize"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-11 text-tertiary">Modules</span>
              <div className="flex items-center gap-1 rounded-sm p-1 text-11 bg-layer-1">
                Favorite
                {isEditingAllowed && (
                  <button
                    type="button"
                    className="grid place-items-center text-tertiary hover:text-secondary"
                    onClick={() =>
                      handleDisplayFiltersUpdate &&
                      handleDisplayFiltersUpdate({
                        favorites: !isFavoriteFilterApplied,
                      })
                    }
                  >
                    <CloseIcon height={10} width={10} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {isEditingAllowed && (
          <button type="button" onClick={handleClearAllFilters}>
            <Tag>
              {t("common.clear_all")}
              <CloseIcon height={12} width={12} strokeWidth={2} />
            </Tag>
          </button>
        )}
      </div>
    </Header>
  );
}
