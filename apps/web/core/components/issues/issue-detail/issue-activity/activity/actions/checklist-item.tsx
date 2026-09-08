/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { CheckSquareOutline } from "@makeplane/propel/icons";
// plane imports
import { CHECKLIST_ITEM_STATUS_MAP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TChecklistItemStatus } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";

type TIssueChecklistItemActivity = { activityId: string; ends: "top" | "bottom" | undefined };

// Handles both checklist_item (add/rename/delete) and checklist_item_status
// (status transitions) — the two `field` values the backend writes (see
// bgtasks/issue_activities_task.py update_checklist_item_activity). No
// activity is ever written for a reorder, so there is no case for it here.
export const IssueChecklistItemActivity = observer(function IssueChecklistItemActivity(
  props: TIssueChecklistItemActivity
) {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const statusLabel = (status: string) => {
    const entry = CHECKLIST_ITEM_STATUS_MAP[status as TChecklistItemStatus];
    return entry ? t(entry.i18n_label) : status;
  };

  let content: ReactNode;
  if (activity.field === "checklist_item_status") {
    content = (
      <>
        <span>moved checklist item </span>
        <span>from </span>
        <span className="font-medium text-primary">{statusLabel(activity.old_value ?? "")}</span>
        <span> to </span>
        <span className="font-medium text-primary">{statusLabel(activity.new_value ?? "")}</span>
      </>
    );
  } else if (activity.verb === "created") {
    content = (
      <>
        <span>added checklist item </span>
        <span className="font-medium text-primary">{activity.new_value}</span>
      </>
    );
  } else if (activity.verb === "deleted") {
    content = (
      <>
        <span>removed checklist item </span>
        <span className="font-medium text-primary">{activity.old_value}</span>
      </>
    );
  } else {
    content = (
      <>
        <span>renamed checklist item </span>
        <span className="font-medium text-primary">{activity.old_value}</span>
        <span> to </span>
        <span className="font-medium text-primary">{activity.new_value}</span>
      </>
    );
  }

  return (
    <IssueActivityBlockComponent
      icon={<CheckSquareOutline width={14} height={14} className="text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      {content}
    </IssueActivityBlockComponent>
  );
});
