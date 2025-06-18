"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
// components
import { RelationActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { useTimeLineRelationOptions } from "@/plane-web/components/relations";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
};

export const RelationsCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, issueId, disabled, issueServiceType = EIssueServiceType.ISSUES } = props;
  const { t } = useTranslation();
  // store hook
  const {
    relation: { getRelationCountByIssueId },
  } = useIssueDetail(issueServiceType);

  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  // derived values
  const relationsCount = getRelationCountByIssueId(issueId, ISSUE_RELATION_OPTIONS);

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{relationsCount}</p>
      </span>
    ),
    [relationsCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("common.relations")}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && <RelationActionButton issueId={issueId} disabled={disabled} issueServiceType={issueServiceType} />
      }
    />
  );
});
