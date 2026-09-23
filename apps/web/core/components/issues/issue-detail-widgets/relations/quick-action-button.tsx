/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { AddOutline } from "@makeplane/propel/icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { handleTriggerClick, handleTriggerKeyDown } from "@/components/common/trigger-guard";
import { useTimeLineRelationOptions } from "@/components/relations";
// types
import type { TIssueRelationTypes } from "@plane/types";

type Props = {
  issueId: string;
  /** Rendered as the trigger itself (not nested inside one); must forward ref and props to a `<button>`. */
  customButton?: React.ReactElement;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const RelationActionButton = observer(function RelationActionButton(props: Props) {
  const { customButton, issueId, disabled = false, issueServiceType } = props;
  const { t } = useTranslation();
  // store hooks
  const { toggleRelationModal, setRelationKey } = useIssueDetail(issueServiceType);

  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();

  // handlers
  const handleOnClick = (relationKey: TIssueRelationTypes) => {
    setRelationKey(relationKey);
    toggleRelationModal(issueId, relationKey);
  };

  return (
    <Menu>
      {customButton ? (
        <MenuTrigger
          disabled={disabled}
          render={customButton}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
        />
      ) : (
        <MenuTrigger
          disabled={disabled}
          aria-label={t("issue.add.relation")}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
        >
          <AddOutline className="h-4 w-4" />
        </MenuTrigger>
      )}
      <MenuContent side="bottom" align="start">
        {Object.values(ISSUE_RELATION_OPTIONS).map((item) => {
          if (!item) return null;

          return (
            <MenuItem
              key={item.key}
              icon={item.icon(12)}
              label={t(item.i18n_label)}
              onClick={(e) => {
                e.stopPropagation();
                handleOnClick(item.key);
              }}
            />
          );
        })}
      </MenuContent>
    </Menu>
  );
});
