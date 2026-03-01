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

import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  issue: TIssue;
};

export const SpreadsheetCustomerColumn = observer(function SpreadsheetCustomerColumn(props: TProps) {
  const { issue } = props;
  const { t } = useTranslation();
  // hooks
  const {
    workItems: { getCustomerCountByWorkItemId },
  } = useCustomers();
  const customerCount = getCustomerCountByWorkItemId(issue.id);
  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-subtle-1 py-1 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10">
      {customerCount} {t("customers.label", { count: customerCount }).toLowerCase()}
    </Row>
  );
});
