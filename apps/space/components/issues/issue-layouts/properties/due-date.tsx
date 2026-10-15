/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { DueDateOutline } from "@makeplane/propel/icons";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useStates } from "@/hooks/store/use-state";
import { ReadOnlyProperty } from "./read-only-property";

type Props = {
  due_date: string | undefined;
  stateId: string | undefined;
  shouldHighLight?: boolean;
  shouldShowBorder?: boolean;
};

export const IssueBlockDate = observer(function IssueBlockDate(props: Props) {
  const { due_date, stateId, shouldHighLight = true, shouldShowBorder = true } = props;
  const { getStateById } = useStates();

  const state = getStateById(stateId);

  const formattedDate = renderFormattedDate(due_date);

  return (
    <ReadOnlyProperty
      icon={DueDateOutline}
      label={formattedDate || "No Date"}
      tooltip={`Due Date: ${formattedDate || "No Date"}`}
      shouldShowBorder={shouldShowBorder}
      danger={Boolean(shouldHighLight && due_date && shouldHighlightIssueDueDate(due_date, state?.group))}
    />
  );
});
