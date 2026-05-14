/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { DueDatePropertyIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useStates } from "@/hooks/store/use-state";

type Props = {
  due_date: string | undefined;
  stateId: string | undefined;
  shouldHighLight?: boolean;
  shouldShowBorder?: boolean;
};

export const IssueBlockDate = observer(function IssueBlockDate(props: Props) {
  const { due_date, stateId, shouldHighLight = true, shouldShowBorder = true } = props;
  const { t } = useTranslation();
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  const formattedDate = renderFormattedDate(due_date);

  return (
    <Tooltip tooltipHeading={t("due_date")} tooltipContent={formattedDate}>
      <div
        className={cn("flex h-full items-center gap-1 rounded-sm px-2.5 py-1 text-11 text-primary", {
          "text-danger-primary": shouldHighLight && due_date && shouldHighlightIssueDueDate(due_date, state?.group),
          "border-[0.5px] border-strong": shouldShowBorder,
        })}
      >
        <DueDatePropertyIcon className="size-3 flex-shrink-0" />
        {formattedDate ? formattedDate : t("localized_ui.space_public.no_date")}
      </div>
    </Tooltip>
  );
});
