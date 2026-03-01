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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/propel/collapsible";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { CustomerRequestActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const CustomerRequestsCollapsibleTitle = observer(function CustomerRequestsCollapsibleTitle(props: Props) {
  const { isOpen, workspaceSlug, workItemId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(workItemId);
  const customerRequestCount = issue?.customer_request_ids?.length ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-14 text-tertiary !leading-3">{customerRequestCount}</p>
      </span>
    ),
    [customerRequestCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("customers.requests.label", { count: 2 })}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && (
          <CustomerRequestActionButton workspaceSlug={workspaceSlug} workItemId={workItemId} disabled={disabled} />
        )
      }
    />
  );
});
