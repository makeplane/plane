import React from "react";

// ui
import { CustomSelect } from "components/ui";
// icons
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { getPriorityIcon } from "components/icons/priority-icon";
// types
import { UserAuth } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  value: string | null;
  onChange: (val: string) => void;
  userAuth: UserAuth;
};

export const SidebarPrioritySelect: React.FC<Props> = ({ value, onChange, userAuth }) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm sm:basis-1/2">
        <ChartBarIcon className="h-4 w-4 flex-shrink-0" />
        <p>Priority</p>
      </div>
      <div className="sm:basis-1/2">
        <CustomSelect
          label={
            <span
              className={`flex items-center gap-2 text-left capitalize ${
                value ? "" : "text-skin-base"
              }`}
            >
              {getPriorityIcon(value && value !== "" ? value ?? "" : "None", "text-sm")}
              {value && value !== "" ? value : "None"}
            </span>
          }
          value={value}
          onChange={onChange}
          width="w-full"
          position="right"
          disabled={isNotAllowed}
        >
          {PRIORITIES.map((option) => (
            <CustomSelect.Option key={option} value={option} className="capitalize">
              <>
                {getPriorityIcon(option, "text-sm")}
                {option ?? "None"}
              </>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
    </div>
  );
};
