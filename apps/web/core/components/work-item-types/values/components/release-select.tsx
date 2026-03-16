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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
import { ReleaseDropdown } from "@/components/dropdowns/release/dropdown";

type TReleaseValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.RELATION>>;
  value: string[];
  workspaceSlug?: string;
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  isDisabled?: boolean;
  buttonClassName?: string;
  onReleaseValueChange: (value: string[]) => Promise<void>;
};

export const ReleaseValueSelect = observer(function ReleaseValueSelect(props: TReleaseValueSelectProps) {
  const {
    propertyDetail,
    value,
    workspaceSlug,
    variant,
    error,
    isDisabled = false,
    buttonClassName = "",
    onReleaseValueChange,
  } = props;
  const { t } = useTranslation();

  return (
    <>
      <ReleaseDropdown
        workspaceSlug={workspaceSlug}
        value={value}
        disabled={isDisabled}
        className={variant === "create" ? "h-8 rounded-sm border-[0.5px] border-subtle-1" : ""}
        buttonClassName={variant === "create" ? "h-full text-body-xs-regular hover:bg-transparent" : buttonClassName}
        onChange={onReleaseValueChange}
        emptyLabel={t("releases.select_releases")}
      />
      {Boolean(error) && (
        <span className="text-caption-md-medium text-danger-primary">
          {error === "REQUIRED" ? t("common.errors.entity_required", { entity: propertyDetail.display_name }) : error}
        </span>
      )}
    </>
  );
});
