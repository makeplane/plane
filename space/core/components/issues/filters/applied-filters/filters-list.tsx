"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// types
import { useTranslation } from "@plane/i18n";
import { TFilters } from "@/types/issue";
// components
import { AppliedPriorityFilters } from "./priority";
import { AppliedStateFilters } from "./state";

type Props = {
  appliedFilters: TFilters;
  handleRemoveAllFilters: () => void;
  handleRemoveFilter: (key: keyof TFilters, value: string | null) => void;
};

export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

export const AppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters = {}, handleRemoveAllFilters, handleRemoveFilter } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TFilters;
        const filterValue = value as TFilters[keyof TFilters];

        if (!filterValue) return;

        return (
          <div
            key={filterKey}
            className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize"
          >
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            <div className="flex flex-wrap items-center gap-1">
              {filterKey === "priority" && (
                <AppliedPriorityFilters
                  handleRemove={(val) => handleRemoveFilter("priority", val)}
                  values={filterValue ?? []}
                />
              )}

              {/* {filterKey === "labels" && labels && (
                <AppliedLabelsFilters
                  handleRemove={(val) => handleRemoveFilter("labels", val)}
                  labels={labels}
                  values={value}
                />
              )} */}

              {filterKey === "state" && (
                <AppliedStateFilters
                  handleRemove={(val) => handleRemoveFilter("state", val)}
                  values={filterValue ?? []}
                />
              )}

              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemoveFilter(filterKey, null)}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={handleRemoveAllFilters}
        className="flex items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 text-xs text-custom-text-300 hover:text-custom-text-200"
      >
        {t("common.clear_all")}
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
});
