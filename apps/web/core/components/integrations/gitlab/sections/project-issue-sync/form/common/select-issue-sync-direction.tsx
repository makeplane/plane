/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { TriangleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { RadioInput } from "@/components/estimates/radio-select";

type TBidirectionalIssueSync = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SelectIssueSyncDirection({ value, onChange }: TBidirectionalIssueSync) {
  const { t } = useTranslation();
  const options = [
    {
      label: t("gitlab_integration.allow_bidirectional_sync"),
      value: "allow_bidirectional_sync",
    },
    {
      label: t("gitlab_integration.allow_unidirectional_sync"),
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
      <div className="text-body-xs-regular text-secondary">{t("gitlab_integration.select_issue_sync_direction")}</div>
      <RadioInput
        selected={getSelectedValue() ?? ""}
        options={options}
        onChange={(value) => onChange(value === "allow_bidirectional_sync")}
        className="z-10"
        buttonClassName="size-3"
        fieldClassName="text-body-xs-regular gap-1.5"
        wrapperClassName="gap-1.5"
        vertical
      />
      {!value && (
        <div className="flex gap-1">
          <TriangleAlert className="size-4 text-secondary text-yellow-500" />
          <div className="text-body-xs-regular text-tertiary text-yellow-500">
            {t("gitlab_integration.allow_unidirectional_sync_warning")}
          </div>
        </div>
      )}
    </div>
  );
}
