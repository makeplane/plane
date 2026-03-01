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

import React, { useCallback } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import type { MemberDropdownProps } from "@/components/dropdowns/member/types";

type TMemberValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.RELATION>>;
  value: string[];
  projectId: string | undefined;
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  buttonClassName?: string;
  onMemberValueChange: (value: string[]) => Promise<void>;
};

export const MemberValueSelect = observer(function MemberValueSelect(props: TMemberValueSelectProps) {
  const {
    propertyDetail,
    value,
    projectId,
    variant,
    error,
    isMultiSelect = false,
    isDisabled = false,
    buttonClassName,
    onMemberValueChange,
  } = props;
  // plane hooks
  const { t } = useTranslation();

  const memberPickerProps: Partial<MemberDropdownProps> = {
    buttonClassName: cn(
      "h-full py-1 text-body-xs-regular justify-between bg-surface-1",
      {
        "text-placeholder": !value?.length,
        "border-subtle-1": variant === "create",
        "border-danger-strong": Boolean(error),
      },
      buttonClassName
    ),
    buttonContainerClassName: cn("w-full text-left", {
      "bg-layer-1": variant === "create" && isDisabled,
    }),
    dropdownArrowClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    placeholder: isMultiSelect ? "Select members" : "Select a member",
    disabled: isDisabled,
    hideIcon: !value?.length,
    placement: "bottom-start",
    dropdownArrow: true,
    showUserDetails: true,
  };

  const handleChange = useCallback(
    (newValue: string[]) => {
      if (!isEqual(newValue, value)) {
        onMemberValueChange(newValue);
      }
    },
    [value, onMemberValueChange]
  );

  return (
    <>
      {isMultiSelect ? (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={value || []}
          onChange={(memberIds) => {
            // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
            document.body?.setAttribute("data-delay-outside-click", "true");
            handleChange(memberIds);
          }}
          buttonVariant={
            variant === "update" && !error
              ? value.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="h-auto w-full flex-grow group"
          multiple
        />
      ) : (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={value?.[0] || null}
          onChange={(memberId) => {
            // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
            document.body?.setAttribute("data-delay-outside-click", "true");
            if (memberId && memberId === value?.[0]) {
              handleChange([]);
            } else {
              handleChange(memberId ? [memberId] : []);
            }
          }}
          buttonVariant={
            variant === "update" && !error
              ? value.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="h-auto w-full flex-grow group"
          multiple={false}
        />
      )}
      {Boolean(error) && (
        <span className="text-caption-md-medium text-danger-primary">
          {error === "REQUIRED" ? t("common.errors.entity_required", { entity: propertyDetail.display_name }) : error}
        </span>
      )}
    </>
  );
});
