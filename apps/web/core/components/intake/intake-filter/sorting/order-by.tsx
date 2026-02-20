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
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import { INBOX_ISSUE_ORDER_BY_OPTIONS, INBOX_ISSUE_SORT_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { CheckIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { TInboxIssueSortingOrderByKeys, TInboxIssueSortingSortByKeys } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

export const InboxIssueOrderByDropdown = observer(function InboxIssueOrderByDropdown() {
  // hooks
  const { t } = useTranslation();
  const { inboxSorting, handleInboxIssueSorting } = useProjectInbox();
  const orderByDetails =
    INBOX_ISSUE_ORDER_BY_OPTIONS.find((option) => inboxSorting?.order_by?.includes(option.key)) || undefined;
  const customButton = (
    <div className={cn(getButtonStyling("secondary", "base"), "px-2 text-tertiary")}>
      {inboxSorting?.sort_by === "asc" ? (
        <ArrowUpWideNarrow className="size-3" />
      ) : (
        <ArrowDownWideNarrow className="size-3" />
      )}
      <span className="hidden @sm:inline">{t(orderByDetails?.i18n_label || "inbox_issue.order_by.created_at")}</span>
      <ChevronDownIcon className="hidden @sm:inline size-3" strokeWidth={2} />
    </div>
  );
  return (
    <CustomMenu customButton={customButton} placement="bottom-end" maxHeight="lg" closeOnSelect>
      {INBOX_ISSUE_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => handleInboxIssueSorting("order_by", option.key as TInboxIssueSortingOrderByKeys)}
        >
          {t(option.i18n_label)}
          {inboxSorting?.order_by?.includes(option.key) && <CheckIcon className="size-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-subtle" />
      {INBOX_ISSUE_SORT_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => handleInboxIssueSorting("sort_by", option.key as TInboxIssueSortingSortByKeys)}
        >
          {t(option.i18n_label)}
          {inboxSorting?.sort_by?.includes(option.key) && <CheckIcon className="size-3" />}
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
