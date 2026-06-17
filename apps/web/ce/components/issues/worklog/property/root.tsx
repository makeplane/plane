/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { formatDuration } from "../utils";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { issueId } = props;
  const { t } = useTranslation();
  const { worklog } = useIssueDetail();

  const totalSeconds = worklog.getTotalDurationByIssueId(issueId);
  if (!totalSeconds) return null;

  return (
    <SidebarPropertyListItem icon={Clock} label={t("common.tracked_time")} childrenClassName="h-7.5">
      <span className="pl-1.5 text-body-xs-regular text-secondary">{formatDuration(totalSeconds)}</span>
    </SidebarPropertyListItem>
  );
});
