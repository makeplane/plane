/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { ISSUE_ORDER_BY_DIRECTION_OPTIONS, ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueOrderByDirection, TIssueOrderByField, TIssueOrderByOptions } from "@plane/types";
import { buildIssueOrderBy, cn, getIssueOrderByDirection, getIssueOrderByField } from "@plane/utils";

// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  selectedOrderBy: TIssueOrderByOptions | undefined;
  handleUpdate: (val: TIssueOrderByOptions) => void;
  orderByOptions: TIssueOrderByOptions[];
};

export const FilterOrderBy = observer(function FilterOrderBy(props: Props) {
  const { selectedOrderBy, handleUpdate, orderByOptions } = props;
  // hooks
  const { t } = useTranslation();

  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDirectionPreviewEnabled, setIsDirectionPreviewEnabled] = useState(true);

  const activeOrderBy = selectedOrderBy ?? "-created_at";
  const activeField = getIssueOrderByField(activeOrderBy);
  const activeDirection = getIssueOrderByDirection(activeOrderBy);
  const activeFieldOption = ISSUE_ORDER_BY_OPTIONS.find((option) => option.key === activeField);
  const isDirectionDisabled = !activeFieldOption?.isDirectional;

  // the layout lists the order by keys it supports; a field is available if either of its directions is listed
  const availableFields = new Set(orderByOptions.map(getIssueOrderByField));

  const handleFieldChange = (field: TIssueOrderByField) => {
    if (field === activeField) return;
    const fieldOption = ISSUE_ORDER_BY_OPTIONS.find((option) => option.key === field);
    // keep the chosen direction when switching between fields that have one
    const direction = fieldOption?.isDirectional
      ? activeFieldOption?.isDirectional
        ? activeDirection
        : fieldOption.defaultDirection
      : "asc";
    handleUpdate(buildIssueOrderBy(field, direction));
  };

  const handleDirectionChange = (direction: TIssueOrderByDirection) => {
    if (isDirectionDisabled || direction === activeDirection) return;
    handleUpdate(buildIssueOrderBy(activeField, direction));
  };

  return (
    <>
      <FilterHeader
        title={t("common.order_by.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_ORDER_BY_OPTIONS.filter((option) => availableFields.has(option.key)).map((orderBy) => (
            <FilterOption
              key={orderBy.key}
              isChecked={activeField === orderBy.key}
              onClick={() => handleFieldChange(orderBy.key)}
              title={t(orderBy.titleTranslationKey)}
              multiple={false}
            />
          ))}
        </div>
      )}
      <FilterHeader
        title={t("common.order_by.direction")}
        isPreviewEnabled={isDirectionPreviewEnabled}
        handleIsPreviewEnabled={() => setIsDirectionPreviewEnabled(!isDirectionPreviewEnabled)}
      />
      {isDirectionPreviewEnabled && (
        <div className={cn({ "pointer-events-none opacity-50": isDirectionDisabled })}>
          {ISSUE_ORDER_BY_DIRECTION_OPTIONS.map((direction) => (
            <FilterOption
              key={direction.key}
              isChecked={!isDirectionDisabled && activeDirection === direction.key}
              onClick={() => handleDirectionChange(direction.key)}
              title={t(direction.titleTranslationKey)}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
