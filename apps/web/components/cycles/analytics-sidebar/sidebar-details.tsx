/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { MembersOutline, LeadOutline, WorkItemsOutline } from "@makeplane/propel/icons";
// plane types
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@makeplane/propel/components/avatar";
import { AvatarGroup } from "@makeplane/propel/components/avatar-group";
import { TextArea } from "@makeplane/propel/components/text-area";
import type { ICycle } from "@plane/types";
// helpers
import { getFileURL } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { DescriptionOverflow } from "@/components/issues/issue-detail/description-overflow";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useMember } from "@/hooks/store/use-member";
// plane web constants

type Props = {
  projectId: string;
  cycleDetails: ICycle;
};

export const CycleSidebarDetails = observer(function CycleSidebarDetails(props: Props) {
  const { projectId, cycleDetails } = props;
  // hooks
  const { getUserDetails } = useMember();
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();
  const { t } = useTranslation();

  const areEstimateEnabled = projectId && areEstimateEnabledByProjectId(projectId.toString());
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase();
  const isCompleted = cycleStatus === "completed";

  const issueCount =
    isCompleted && !isEmpty(cycleDetails?.progress_snapshot)
      ? cycleDetails?.progress_snapshot?.total_issues === 0
        ? `0 ${t("common.work_item")}`
        : `${cycleDetails?.progress_snapshot?.completed_issues}/${cycleDetails?.progress_snapshot?.total_issues}`
      : cycleDetails?.total_issues === 0
        ? `0 ${t("common.work_item")}`
        : `${cycleDetails?.completed_issues}/${cycleDetails?.total_issues}`;
  const estimateType = areEstimateEnabled && currentActiveEstimateId && estimateById(currentActiveEstimateId);
  const cycleOwnerDetails = cycleDetails ? getUserDetails(cycleDetails.owned_by_id) : undefined;

  const isEstimatePointValid = isEmpty(cycleDetails?.progress_snapshot || {})
    ? estimateType && estimateType?.type == EEstimateSystem.POINTS
      ? true
      : false
    : isEmpty(cycleDetails?.progress_snapshot?.estimate_distribution || {})
      ? false
      : true;

  const issueEstimatePointCount =
    isCompleted && !isEmpty(cycleDetails?.progress_snapshot)
      ? cycleDetails?.progress_snapshot.total_issues === 0
        ? `0 ${t("common.work_item")}`
        : `${cycleDetails?.progress_snapshot.completed_estimate_points}/${cycleDetails?.progress_snapshot.total_estimate_points}`
      : cycleDetails?.total_issues === 0
        ? `0 ${t("common.work_item")}`
        : `${cycleDetails?.completed_estimate_points}/${cycleDetails?.total_estimate_points}`;
  return (
    <div className="flex w-full flex-col gap-6">
      {cycleDetails?.description?.trim() && (
        // Long descriptions clip at 140px behind a "Show all" / "Show less" toggle.
        <DescriptionOverflow maxHeight={140}>
          <div className="flex w-full">
            <TextArea size="xl" surface="inline" autoResize value={cycleDetails.description} disabled />
          </div>
        </DescriptionOverflow>
      )}

      <section className="border-t border-subtle pt-6">
        <h3 className="mb-2 text-body-sm-medium text-primary">{t("common.properties")}</h3>
        <div className="flex flex-col gap-2 text-body-xs-regular text-primary">
          <SidebarPropertyListItem icon={LeadOutline} label={t("lead")}>
            {cycleOwnerDetails ? (
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  alt={cycleOwnerDetails.display_name}
                  fallback={cycleOwnerDetails.display_name?.[0]?.toUpperCase()}
                  src={getFileURL(cycleOwnerDetails.avatar_url ?? "")}
                  size="2xs"
                />
                <span className="truncate">{cycleOwnerDetails.display_name}</span>
              </div>
            ) : (
              <span className="text-tertiary">{t("none")}</span>
            )}
          </SidebarPropertyListItem>
          <SidebarPropertyListItem icon={MembersOutline} label={t("members")}>
            {cycleDetails?.assignee_ids && cycleDetails.assignee_ids.length > 0 ? (
              <AvatarGroup size="2xs" max={2}>
                {cycleDetails.assignee_ids.map((member) => {
                  const memberDetails = getUserDetails(member);
                  return (
                    <Avatar
                      key={member}
                      alt={memberDetails?.display_name ?? ""}
                      src={getFileURL(memberDetails?.avatar_url ?? "")}
                    />
                  );
                })}
              </AvatarGroup>
            ) : (
              <span className="text-tertiary">{t("no_assignee")}</span>
            )}
          </SidebarPropertyListItem>
          <SidebarPropertyListItem icon={WorkItemsOutline} label={t("work_items")}>
            <span>{issueCount}</span>
          </SidebarPropertyListItem>
          {/**
           * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
           */}
          {isEstimatePointValid && !isCompleted && (
            <SidebarPropertyListItem icon={WorkItemsOutline} label={t("points")}>
              <span>{issueEstimatePointCount}</span>
            </SidebarPropertyListItem>
          )}
        </div>
      </section>
    </div>
  );
});
