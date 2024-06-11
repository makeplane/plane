"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Check, ChevronDown } from "lucide-react";
import { CustomMenu, getButtonStyling } from "@plane/ui";
// constants
import { INBOX_ISSUE_ORDER_BY_OPTIONS, INBOX_ISSUE_SORT_BY_OPTIONS } from "@/constants/inbox";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectInbox } from "@/hooks/store";

export const InboxIssueOrderByDropdown: FC = observer(() => {
  // hooks
  const { inboxSorting, handleInboxIssueSorting } = useProjectInbox();
  const orderByDetails =
    INBOX_ISSUE_ORDER_BY_OPTIONS.find((option) => inboxSorting?.order_by?.includes(option.key)) || undefined;

  return (
    <CustomMenu
      customButton={
        <div className={cn(getButtonStyling("neutral-primary", "sm"), "px-2 text-custom-text-300")}>
          {inboxSorting?.sort_by === "asc" ? (
            <ArrowUpWideNarrow className="h-3 w-3" />
          ) : (
            <ArrowDownWideNarrow className="h-3 w-3" />
          )}
          {orderByDetails?.label || "Order By"}
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        </div>
      }
      placement="bottom-end"
      maxHeight="lg"
      closeOnSelect
    >
      {INBOX_ISSUE_ORDER_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => handleInboxIssueSorting("order_by", option.key)}
        >
          {option.label}
          {inboxSorting?.order_by?.includes(option.key) && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
      <hr className="my-2 border-custom-border-200" />
      {INBOX_ISSUE_SORT_BY_OPTIONS.map((option) => (
        <CustomMenu.MenuItem
          key={option.key}
          className="flex items-center justify-between gap-2"
          onClick={() => handleInboxIssueSorting("sort_by", option.key)}
        >
          {option.label}
          {inboxSorting?.sort_by?.includes(option.key) && <Check className="h-3 w-3" />}
        </CustomMenu.MenuItem>
      ))}
    </CustomMenu>
  );
});
