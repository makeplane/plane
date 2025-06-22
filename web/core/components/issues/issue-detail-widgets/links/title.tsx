"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
// components
import { IssueLinksActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, issueId, disabled, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(issueId);

  const linksCount = issue?.link_count ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{linksCount}</p>
      </span>
    ),
    [linksCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("common.links")}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && <IssueLinksActionButton issueServiceType={issueServiceType} disabled={disabled} />
      }
    />
  );
});
