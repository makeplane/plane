import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TPageFilterProps } from "@plane/types";
// components
import { Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import { AppliedDateFilters, AppliedMembersFilters } from "@/components/common/applied-filters";
// helpers
// types

type Props = {
  appliedFilters: TPageFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TPageFilterProps, value: string | null) => void;
  alwaysAllowEditing?: boolean;
};

const MEMBERS_FILTERS = ["created_by"];
const DATE_FILTERS = ["created_at"];

export const PageAppliedFiltersList: React.FC<Props> = (props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  const { t } = useTranslation();

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TPageFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <Tag key={filterKey}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
              {DATE_FILTERS.includes(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
                />
              )}
              {MEMBERS_FILTERS.includes(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
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
