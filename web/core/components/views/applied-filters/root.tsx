import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EViewAccess, TViewFilterProps } from "@plane/types";
// components
import { Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import { AppliedDateFilters, AppliedMembersFilters } from "@/components/common/applied-filters";
// constants
// helpers
import { AppliedAccessFilters } from "./access";
// types

type Props = {
  appliedFilters: TViewFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TViewFilterProps, value: string | EViewAccess | null) => void;
  alwaysAllowEditing?: boolean;
};

const MEMBERS_FILTERS = ["owned_by"];
const DATE_FILTERS = ["created_at"];
const VIEW_ACCESS_FILTERS = ["view_type"];

export const ViewAppliedFiltersList: React.FC<Props> = (props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  const { t } = useTranslation();

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TViewFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <Tag key={filterKey}>
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            {VIEW_ACCESS_FILTERS.includes(filterKey) && (
              <AppliedAccessFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                values={Array.isArray(value) ? (value as EViewAccess[]) : []}
              />
            )}
            {DATE_FILTERS.includes(filterKey) && (
              <AppliedDateFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                values={Array.isArray(value) ? (value as string[]) : []}
              />
            )}
            {MEMBERS_FILTERS.includes(filterKey) && (
              <AppliedMembersFilters
                editable={isEditingAllowed}
                handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                values={Array.isArray(value) ? (value as string[]) : []}
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
            {t("common.clear_all")}
            <X size={12} strokeWidth={2} />
          </Tag>
        </button>
      )}
    </div>
  );
};
