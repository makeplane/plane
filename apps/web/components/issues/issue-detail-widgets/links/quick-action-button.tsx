/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { cloneElement } from "react";
import { observer } from "mobx-react";
import { AddOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  /** Rendered as the button itself; receives the click handler and `disabled`. */
  customButton?: React.ReactElement<React.ComponentPropsWithoutRef<"button">>;
  /** Hover label for `customButton`. */
  tooltip?: string;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

export const IssueLinksActionButton = observer(function IssueLinksActionButton(props: Props) {
  const { t } = useTranslation();
  const { customButton, tooltip, disabled = false, issueServiceType } = props;
  // store hooks
  const { toggleIssueLinkModal } = useIssueDetail(issueServiceType);

  // handlers
  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleIssueLinkModal(true);
  };

  if (customButton) {
    const button = cloneElement(customButton, { onClick: handleOnClick, disabled });
    return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : button;
  }

  return (
    <IconButton
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t("common.add_link")}
      onClick={handleOnClick}
      disabled={disabled}
      icon={<Icon icon={AddOutline} />}
    />
  );
});
