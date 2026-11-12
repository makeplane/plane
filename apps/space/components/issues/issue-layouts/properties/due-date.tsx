/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { DueDateOutline, StartDateOutline } from "@makeplane/propel/icons";
// plane imports
import { DateSelect } from "@plane/blocks/property-select";
import type { SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { cn, getDate, getIssueDueDateClassName } from "@plane/utils";
// hooks
import { useStates } from "@/hooks/store/use-state";

/** `getIssueDueDateClassName` tones, re-applied over the disabled trigger's muted text colour. */
const DUE_DATE_TONE_CLASSNAME: Record<string, string> = {
  "text-label-crimson-text": "disabled:text-label-crimson-text!",
  "text-label-yellow-text": "disabled:text-label-yellow-text!",
};

type Props = {
  date: string | undefined | null;
  stateId: string | undefined;
  /** `start` shows the start date without a due-date tone. */
  type?: "start" | "due";
  variant?: SelectVariant;
  placeholder?: string;
  className?: string;
};

/** A work item start or due date as a read-only `DateSelect` chip, toned when the due date is close or past. */
export const IssueBlockDate = observer(function IssueBlockDate(props: Props) {
  const { date, stateId, type = "due", variant = "pill-md", placeholder, className } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useStates();
  // derived values
  const isDueDate = type === "due";
  const heading = isDueDate ? t("common.order_by.due_date") : t("common.order_by.start_date");
  const dueDateClassName = isDueDate && date ? getIssueDueDateClassName(date, getStateById(stateId)?.group) : "";

  return (
    <DateSelect
      value={getDate(date) ?? null}
      onChange={() => {}}
      variant={variant}
      icon={isDueDate ? <DueDateOutline /> : <StartDateOutline />}
      placeholder={placeholder}
      className={cn(
        "disabled:pointer-events-none disabled:text-secondary!",
        className,
        DUE_DATE_TONE_CLASSNAME[dueDateClassName]
      )}
      showTooltip
      tooltipHeading={heading}
      tooltipEmptyContent={t("common.none")}
      disabled
    />
  );
});
