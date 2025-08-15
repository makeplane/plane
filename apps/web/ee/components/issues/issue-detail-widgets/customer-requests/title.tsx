"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { CustomerRequestActionButton } from "@/plane-web/components/issues/issue-detail-widgets";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const CustomerRequestsCollapsibleTitle: FC<Props> = observer((props) => {
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
        <p className="text-base text-custom-text-300 !leading-3">{customerRequestCount}</p>
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
