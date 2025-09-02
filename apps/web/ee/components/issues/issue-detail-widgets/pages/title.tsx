"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
// components
import { PagesActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  workItemId: string;
  disabled: boolean;
  count: number;
  issueServiceType: TIssueServiceType;
};

export const PagesCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, workItemId, disabled, count, issueServiceType } = props;
  const { t } = useTranslation();

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{count}</p>
      </span>
    ),
    [count]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("issue.pages.linked_pages")}
      indicatorElement={indicatorElement}
      actionItemElement={
        !disabled && (
          <PagesActionButton issueServiceType={issueServiceType} disabled={disabled} workItemId={workItemId} />
        )
      }
    />
  );
});
