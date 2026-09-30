/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers } from "lucide-react";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import {
  IssueActivityBlockComponent,
  IssueLink,
} from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { useWorkspaceIssueTypes } from "@/plane-web/hooks/use-workspace-issue-types";

export type TIssueTypeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTypeActivity = observer(function IssueTypeActivity(props: TIssueTypeActivity) {
  const { activityId, showIssue = true, ends } = props;
  const { workspaceSlug } = useParams();
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { typeMap } = useWorkspaceIssueTypes(workspaceSlug?.toString(), false);

  const activity = getActivityById(activityId);
  if (!activity) return null;

  const oldType = activity.old_identifier ? typeMap[String(activity.old_identifier)] : undefined;
  const newType = activity.new_identifier ? typeMap[String(activity.new_identifier)] : undefined;

  return (
    <IssueActivityBlockComponent
      icon={<Layers height={14} width={14} className="text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        changed the type
        {oldType ? (
          <>
            {" "}
            from{" "}
            <span className="inline-flex items-center gap-1 rounded border border-subtle bg-surface-2 px-1 py-0.5 text-11">
              <SwitcherIcon logo_props={oldType.logo_props} LabelIcon={Layers} size={10} />
              {oldType.name}
            </span>
          </>
        ) : null}
        {newType ? (
          <>
            {" "}
            to{" "}
            <span className="inline-flex items-center gap-1 rounded border border-subtle bg-surface-2 px-1 py-0.5 text-11">
              <SwitcherIcon logo_props={newType.logo_props} LabelIcon={Layers} size={10} />
              {newType.name}
            </span>
          </>
        ) : null}
        {showIssue ? " on " : null}
        {showIssue ? <IssueLink activityId={activityId} /> : null}
      </>
    </IssueActivityBlockComponent>
  );
});
