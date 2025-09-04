"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { JiraPriority } from "@plane/etl/jira";
import { useTranslation } from "@plane/i18n";
import { PriorityIcon } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web types
import { TPlanePriorityData } from "@/plane-web/types/importers";

type TMapPrioritiesSelection = {
  value: string | undefined;
  handleValue: (value: string | undefined) => void;
  planePriorities: TPlanePriorityData[];
};

export const MapPrioritiesSelection: FC<TMapPrioritiesSelection> = observer((props) => {
  const { value, handleValue, planePriorities } = props;

  const { t } = useTranslation();

  return (
    <Dropdown
      dropdownOptions={(planePriorities || [])?.map((state) => ({
        key: state.key,
        label: state.label,
        value: state.key,
        data: state,
      }))}
      value={value}
      placeHolder={t("importers.select_priority")}
      onChange={(value: string | undefined) => handleValue(value)}
      iconExtractor={(option) => (
        <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
          <PriorityIcon priority={option?.key || "none"} />
        </div>
      )}
      queryExtractor={(option) => option.label}
    />
  );
});
