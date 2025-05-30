import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TModuleDisplayFilters, TModuleFilters } from "@plane/types";
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

export const ModuleAppliedFiltersList: React.FC<Props> = (props) => {
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
                <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
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
                    className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                    onClick={() => handleRemoveFilter(filterKey, null)}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            </Tag>
          );
        })}
        {!isArchived && isFavoriteFilterApplied && (
          <div
            key="module_display_filters"
            className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-custom-text-300">Modules</span>
              <div className="flex items-center gap-1 rounded p-1 text-xs bg-custom-background-80">
                Favorite
                {isEditingAllowed && (
                  <button
                    type="button"
                    className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                    onClick={() =>
                      handleDisplayFiltersUpdate &&
                      handleDisplayFiltersUpdate({
                        favorites: !isFavoriteFilterApplied,
                      })
                    }
                  >
                    <X size={10} strokeWidth={2} />
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
              <X size={12} strokeWidth={2} />
            </Tag>
          </button>
        )}
      </div>
    </Header>
  );
};
