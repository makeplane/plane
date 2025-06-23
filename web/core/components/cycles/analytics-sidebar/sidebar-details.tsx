"use client";
import React, { FC } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { LayersIcon, SquareUser, Users } from "lucide-react";
// plane types
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ICycle } from "@plane/types";
// plane ui
import { Avatar, AvatarGroup, TextArea } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember, useProjectEstimates } from "@/hooks/store";
// plane web constants

type Props = {
  projectId: string;
  cycleDetails: ICycle;
};

export const CycleSidebarDetails: FC<Props> = observer((props) => {
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
    <div className="flex flex-col gap-5 w-full">
      {cycleDetails?.description && (
        <TextArea
          className="outline-none ring-none w-full max-h-max bg-transparent !p-0 !m-0 !border-0 resize-none text-sm leading-5 text-custom-text-200"
          value={cycleDetails.description}
          disabled
        />
      )}

      <div className="flex flex-col gap-5 pb-6 pt-2.5">
        <div className="flex items-center justify-start gap-1">
          <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
            <SquareUser className="h-4 w-4" />
            <span className="text-base">{t("lead")}</span>
          </div>
          <div className="flex w-3/5 items-center rounded-sm">
            <div className="flex items-center gap-2.5">
              <Avatar name={cycleOwnerDetails?.display_name} src={getFileURL(cycleOwnerDetails?.avatar_url ?? "")} />
              <span className="text-sm text-custom-text-200">{cycleOwnerDetails?.display_name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start gap-1">
          <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
            <Users className="h-4 w-4" />
            <span className="text-base">{t("members")}</span>
          </div>
          <div className="flex w-3/5 items-center rounded-sm">
            <div className="flex items-center gap-2.5">
              {cycleDetails?.assignee_ids && cycleDetails.assignee_ids.length > 0 ? (
                <>
                  <AvatarGroup showTooltip>
                    {cycleDetails.assignee_ids.map((member) => {
                      const memberDetails = getUserDetails(member);
                      return (
                        <Avatar
                          key={memberDetails?.id}
                          name={memberDetails?.display_name ?? ""}
                          src={getFileURL(memberDetails?.avatar_url ?? "")}
                          showTooltip={false}
                        />
                      );
                    })}
                  </AvatarGroup>
                </>
              ) : (
                <span className="px-1.5 text-sm text-custom-text-300">{t("no_assignee")}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start gap-1">
          <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
            <LayersIcon className="h-4 w-4" />
            <span className="text-base">{t("work_items")}</span>
          </div>
          <div className="flex w-3/5 items-center">
            <span className="px-1.5 text-sm text-custom-text-300">{issueCount}</span>
          </div>
        </div>

        {/**
         * NOTE: Render this section when estimate points of he projects is enabled and the estimate system is points
         */}
        {isEstimatePointValid && !isCompleted && (
          <div className="flex items-center justify-start gap-1">
            <div className="flex w-2/5 items-center justify-start gap-2 text-custom-text-300">
              <LayersIcon className="h-4 w-4" />
              <span className="text-base">{t("points")}</span>
            </div>
            <div className="flex w-3/5 items-center">
              <span className="px-1.5 text-sm text-custom-text-300">{issueEstimatePointCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
