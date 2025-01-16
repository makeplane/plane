"use client";

import { FC } from "react";
// helpers
import { cn } from "@/helpers/common.helper";
// silo hooks
import { useImporter } from "@/plane-web/silo/jira/hooks";
// silo types
import { E_FORM_RADIO_DATA, TFormRadioData } from "@/plane-web/silo/jira/types";

type TConfigureJiraSelectIssueType = {
  value: TFormRadioData;
  handleFormData: (value: TFormRadioData) => void;
};

const radioOptions: { key: TFormRadioData; label: string }[] = [
  { key: E_FORM_RADIO_DATA.CREATE_AS_LABEL, label: "Create as a label" },
  { key: E_FORM_RADIO_DATA.ADD_IN_TITLE, label: "Add [ issue_type ] in the title" },
];

export const ConfigureJiraSelectIssueType: FC<TConfigureJiraSelectIssueType> = (props) => {
  // props
  const { value, handleFormData } = props;
  // hooks
  const { handleSyncJobConfig } = useImporter();

  const handelData = (value: TFormRadioData) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      handleSyncJobConfig("issueType", value);
    }
  };

  return (
    <div className="space-y-2 pt-6">
      <div className="text-sm text-custom-text-200">How do you want to record issue types in Plane?</div>
      <div className="space-y-2 flex flex-col">
        {radioOptions.map((option) => (
          <div
            key={option.key}
            className="inline-flex items-center gap-2 cursor-pointer"
            onClick={() => handelData(option.key)}
          >
            <div
              className={cn(
                "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-full transition-all",
                { "border-custom-primary-100": value === option.key }
              )}
            >
              <div
                className={cn("w-full h-full bg-custom-background-80 rounded-full transition-all", {
                  "bg-custom-primary-100": value === option.key,
                })}
              />
            </div>
            <div className="text-sm text-custom-text-100">{option.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
