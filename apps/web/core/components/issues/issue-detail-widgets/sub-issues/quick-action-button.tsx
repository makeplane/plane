/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AddOutline, WorkItemsOutline } from "@makeplane/propel/icons";
import type { TIssue, TIssueServiceType } from "@plane/types";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issueId: string;
  customButton?: React.ReactNode;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

// trigger guard: keep clicks and Enter/Space on the trigger from reaching clickable ancestors
const handleTriggerClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};
const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
};

export const SubIssuesActionButton = observer(function SubIssuesActionButton(props: Props) {
  const { issueId, customButton, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
    toggleCreateIssueModal,
    toggleSubIssuesModal,
    setIssueCrudOperationState,
    issueCrudOperationState,
  } = useIssueDetail(issueServiceType);

  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return <></>;

  // handlers
  const handleIssueCrudState = (
    key: "create" | "existing",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudOperationState({
      ...issueCrudOperationState,
      [key]: {
        toggle: !issueCrudOperationState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const handleCreateNew = () => {
    handleIssueCrudState("create", issueId, null);
    toggleCreateIssueModal(true);
  };

  const handleAddExisting = () => {
    handleIssueCrudState("existing", issueId, null);
    toggleSubIssuesModal(issue.id);
  };

  // options
  const optionItems = [
    {
      i18n_label: "common.create_new",
      icon: <AddOutline className="h-3 w-3" />,
      onClick: handleCreateNew,
    },
    {
      i18n_label: "common.add_existing",
      icon: <WorkItemsOutline className="h-3 w-3" />,
      onClick: handleAddExisting,
    },
  ];

  return (
    <Menu>
      <MenuTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            aria-label={customButton ? undefined : t("issue.add.sub_issue")}
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
          />
        }
      >
        {customButton ?? <AddOutline className="h-4 w-4" />}
      </MenuTrigger>
      <MenuContent side="bottom" align="start">
        {optionItems.map((item) => (
          <MenuItem
            key={item.i18n_label}
            icon={item.icon}
            label={t(item.i18n_label)}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
            }}
          />
        ))}
      </MenuContent>
    </Menu>
  );
});
