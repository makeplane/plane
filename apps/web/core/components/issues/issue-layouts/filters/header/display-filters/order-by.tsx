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

import { useState } from "react";
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import type { WorkItemOrderByKeys, TIssueOrderByOptions } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  selectedOrderBy: TIssueOrderByOptions | undefined;
  handleUpdate: (val: TIssueOrderByOptions) => void;
  orderByOptions: WorkItemOrderByKeys[];
};

export const FilterOrderBy = observer(function FilterOrderBy(props: Props) {
  const { selectedOrderBy, handleUpdate, orderByOptions } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDescending, setIsDescending] = useState(selectedOrderBy?.startsWith("-") ?? true);
  // translation
  const { t } = useTranslation();
  // derived values
  const resolvedOrderBy: WorkItemOrderByKeys = (
    selectedOrderBy ? (selectedOrderBy?.startsWith("-") ? selectedOrderBy.slice(1) : selectedOrderBy) : "created_at"
  ) as WorkItemOrderByKeys;

  return (
    <>
      <FilterHeader
        appendElement={
          <Tooltip tooltipContent={isDescending ? t("common.order_by.desc") : t("common.order_by.asc")}>
            <IconButton
              icon={isDescending ? ArrowUpNarrowWide : ArrowDownNarrowWide}
              size="sm"
              variant="tertiary"
              onClick={() => {
                const nextIsDescending = !isDescending;
                setIsDescending(nextIsDescending);
                if (resolvedOrderBy) {
                  handleUpdate(nextIsDescending ? `-${resolvedOrderBy}` : resolvedOrderBy);
                }
              }}
              aria-label={`${t("common.order_by.label")} ${isDescending ? t("common.order_by.desc") : t("common.order_by.asc")}`}
              title={isDescending ? t("common.order_by.desc") : t("common.order_by.asc")}
            />
          </Tooltip>
        }
        title={t("common.order_by.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_ORDER_BY_OPTIONS.filter((option) => orderByOptions.includes(option.key)).map((orderBy) => (
            <FilterOption
              key={orderBy.key}
              isChecked={resolvedOrderBy === orderBy.key}
              onClick={() => handleUpdate(isDescending ? `-${orderBy.key}` : orderBy.key)}
              title={t(orderBy.titleTranslationKey)}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
