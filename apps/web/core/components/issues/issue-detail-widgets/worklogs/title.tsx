/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
import { CollapsibleButton } from "@plane/ui";
import { formatWorklogDuration } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueWorklogActionButton } from "./quick-action-button";

type Props = {
  isOpen: boolean;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  onLogTime: () => void;
};

export const IssueWorklogsCollapsibleTitle = observer(function IssueWorklogsCollapsibleTitle(props: Props) {
  const { isOpen, issueId, disabled, onLogTime } = props;
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail(props.issueServiceType);

  const issue = getIssueById(issueId);
  const total = issue?.total_logged_time ?? 0;

  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center">
        <p className="text-14 !leading-3 text-tertiary">{formatWorklogDuration(total)}</p>
      </span>
    ),
    [total]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title={t("common.worklogs")}
      indicatorElement={indicatorElement}
      actionItemElement={!disabled && <IssueWorklogActionButton onClick={onLogTime} disabled={disabled} />}
    />
  );
});
