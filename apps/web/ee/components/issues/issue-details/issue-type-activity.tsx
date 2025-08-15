"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ArrowRightLeft } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// ce imports
import {
  IssueTypeActivity as BaseIssueTypeActivity,
  TIssueTypeActivity,
} from "@/ce/components/issues/issue-details/issue-type-activity";
// components
import {
  IssueActivityBlockComponent,
  IssueLink,
} from "@/components/issues/issue-detail/issue-activity/activity/actions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDetail = {
  issueTypeId: string;
  className?: string;
};

const IssueTypeDetail: FC<TIssueTypeDetail> = observer((props) => {
  const { issueTypeId, className = "" } = props;
  // hooks
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueTypeDetail = getIssueTypeById(issueTypeId);

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-custom-text-100", className)}>
      <IssueTypeLogo icon_props={issueTypeDetail?.logo_props?.icon} size="xs" isDefault={issueTypeDetail?.is_default} />
      {issueTypeDetail?.name}
    </span>
  );
});

export const IssueTypeActivity: FC<TIssueTypeActivity> = observer((props) => {
  const { activityId, showIssue = false, ends } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  // derived values
  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const isWorkItemTypeEnabled =
    workspaceSlug && activity?.project
      ? isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), activity?.project)
      : false;

  if (!isWorkItemTypeEnabled) return <BaseIssueTypeActivity {...props} />;

  return (
    <IssueActivityBlockComponent
      icon={<ArrowRightLeft className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <span className="inline-flex items-center">
        changed work item type to{" "}
        {activity.new_identifier && <IssueTypeDetail issueTypeId={activity.new_identifier} className="px-1" />}
        from {activity.old_identifier && <IssueTypeDetail issueTypeId={activity.old_identifier} className="pl-1" />}
        {showIssue ? ` for ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </span>
    </IssueActivityBlockComponent>
  );
});
