"use client";

import { FC } from "react";
import { PriorityIcon } from "@plane/ui";
import { JiraPriority } from "@silo/jira";
// silo types
import { TPlanePriorityData } from "@/plane-web/silo/types/common";
// silo ui components
import { Dropdown } from "@/plane-web/silo/ui";

type TMapPrioritiesSelection = {
  value: string | undefined;
  handleValue: (value: string | undefined) => void;
  jiraPriority: JiraPriority;
  planePriorities: TPlanePriorityData[];
};

export const MapPrioritiesSelection: FC<TMapPrioritiesSelection> = (props) => {
  const { value, handleValue, jiraPriority, planePriorities } = props;

  return (
    <div className="relative grid grid-cols-2 items-center p-3 text-sm">
      <div className="text-custom-text-200">{jiraPriority?.name}</div>
      <div>
        <Dropdown
          dropdownOptions={(planePriorities || [])?.map((state) => ({
            key: state.key,
            label: state.label,
            value: state.key,
            data: state,
          }))}
          value={value}
          placeHolder="Select Priority"
          onChange={(value: string | undefined) => handleValue(value)}
          iconExtractor={(option) => (
            <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              <PriorityIcon priority={option?.key || "none"} />
            </div>
          )}
          queryExtractor={(option) => option.label}
        />
      </div>
    </div>
  );
};
