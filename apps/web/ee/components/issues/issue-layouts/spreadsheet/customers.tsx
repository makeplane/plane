import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TIssue } from "@plane/types";
import { Row } from "@plane/ui";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  issue: TIssue;
};

export const SpreadsheetCustomerColumn: React.FC<TProps> = observer((props) => {
  const { issue } = props;
  const { t } = useTranslation();
  // hooks
  const {
    workItems: { getCustomerCountByWorkItemId },
  } = useCustomers();
  const customerCount = getCustomerCountByWorkItemId(issue.id);
  return (
    <Row className="flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 py-1 text-xs hover:bg-custom-background-80 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10">
      {customerCount} {t("customers.label", { count: customerCount }).toLowerCase()}
    </Row>
  );
});
