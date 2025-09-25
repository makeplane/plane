"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { RadioInput } from "@/components/estimates/radio-select";

type TBidirectionalIssueSync = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export const SelectIssueSyncDirection = ({ value, onChange }: TBidirectionalIssueSync) => {
  const { t } = useTranslation();
  const options = [
    {
      label: t("github_integration.allow_bidirectional_sync"),
      value: "allow_bidirectional_sync",
    },
    {
      label: t("github_integration.allow_unidirectional_sync"),
      value: "allow_unidirectional_sync",
    },
  ];

  const getSelectedValue = () => {
    if (value === undefined) {
      return undefined;
    }
    return value ? "allow_bidirectional_sync" : "allow_unidirectional_sync";
  };

  return (
    <div className="flex flex-col items-start gap-1.5 pt-2 mb-4">
      <div className="text-sm text-custom-text-200">{t("github_integration.select_issue_sync_direction")}</div>
      <RadioInput
        selected={getSelectedValue() ?? ""}
        options={options}
        onChange={(value) => onChange(value === "allow_bidirectional_sync")}
        className="z-10"
        buttonClassName="size-3"
        fieldClassName="text-sm gap-1.5"
        wrapperClassName="gap-1.5"
        vertical
      />
      {!value && (
        <div className="flex gap-1">
          <TriangleAlert className="size-4 text-custom-text-200 text-yellow-500" />
          <div className="text-sm text-custom-text-300 text-yellow-500">
            {t("github_integration.allow_unidirectional_sync_warning")}
          </div>
        </div>
      )}
    </div>
  );
};
