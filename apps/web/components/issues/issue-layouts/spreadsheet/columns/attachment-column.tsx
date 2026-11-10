/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/blocks/layout";

type Props = {
  issue: TIssue;
};

export const SpreadsheetAttachmentColumn = observer(function SpreadsheetAttachmentColumn(props: Props) {
  const { issue } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle py-1 group-[.selected-issue-row]:bg-accent-primary/5 hover:bg-layer-transparent-hover group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {t("issue.attachment_count", { count: issue?.attachment_count ?? 0 })}
    </Row>
  );
});
