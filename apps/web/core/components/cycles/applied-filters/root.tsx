import { observer } from "mobx-react";
import { X } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TCycleFilters } from "@plane/types";
// hooks
import { Tag } from "@plane/ui";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import { AppliedDateFilters, AppliedStatusFilters } from "@/components/cycles";
import { useUserPermissions } from "@/hooks/store";

// components
// helpers
// types
// constants

type Props = {
  appliedFilters: TCycleFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TCycleFilters, value: string | null) => void;
  alwaysAllowEditing?: boolean;
};

const DATE_FILTERS = ["start_date", "end_date"];

export const CycleAppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  if (!appliedFilters) return null;

  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed =
    alwaysAllowEditing ||
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TCycleFilters;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <Tag key={filterKey}>
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            <div className="flex flex-wrap items-center gap-1">
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
});
