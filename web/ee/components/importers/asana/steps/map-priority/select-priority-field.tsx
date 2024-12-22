"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Loader } from "@plane/ui";
import { AsanaCustomField } from "@silo/asana";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";

type TConfigureAsanaSelectPriority = {
  value: string | undefined;
  isLoading: boolean;
  asanaPriorities: AsanaCustomField[];
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectPriority: FC<TConfigureAsanaSelectPriority> = observer((props) => {
  // props
  const { value, isLoading, asanaPriorities, handleFormData } = props;

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Asana priority field</div>
      {isLoading ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(asanaPriorities || [])?.map((priority) => ({
            key: priority.gid,
            label: priority.name,
            value: priority.gid,
            data: priority,
          }))}
          value={value}
          placeHolder="Select Asana priority"
          onChange={(value: string | undefined) => handleFormData(value)}
          queryExtractor={(option) => option.name}
          disabled={false}
        />
      )}
    </div>
  );
});
