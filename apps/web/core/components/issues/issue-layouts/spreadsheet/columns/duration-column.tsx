/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import type { TIssue } from "@plane/types";
// helpers
import { Row } from "@plane/ui";

type Props = {
  issue: TIssue;
};

export const SpreadsheetDurationColumn = observer(function SpreadsheetDurationColumn(props: Props) {
  const { issue } = props;
  // i18n
  const { t } = useTranslation();

  const durationLabel =
    issue.duration === null || issue.duration === undefined ? "" : t("duration_days", { count: issue.duration });

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle text-11 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-1 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {durationLabel}
    </Row>
  );
});
