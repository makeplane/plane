/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { EntityDetailSidebarGroup, EntityDetailPropertyField, EntityDetailDivider } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import {
  CycleIcon,
  ModuleIcon,
  LabelPropertyIcon,
  EstimatePropertyIcon,
  ReleaseIcon,
  InfoIcon,
  CreatedAtPropertyIcon,
  UpdatedAtPropertyIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { cn, calculateTimeAgo, renderFormattedDateTime } from "@plane/utils";
// components
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { TransferHopInfo } from "@/components/issues/issue-detail/transfer-hop-info";
import { IssueWorklogProperty } from "@/components/issues/worklog/property";
import { WorkItemCustomPropertyValuesUpdate } from "@/components/work-item-types/values/addition-properties-update";
// local imports
import { AuditMetadataRows } from "./audit-metadata-rows";
import { IssueCycleSelect } from "./cycle-select";
import { IssueLabel } from "./label";
import { IssueModuleSelect } from "./module-select";
import type { TIssueOperations } from "./root";
import { WorkItemSidebarCustomers } from "./customers/root";
import { WorkItemSideBarMilestoneItem } from "./milestones/root";
import { ReleaseSelect } from "./release-select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useFlag, useIssueTypes, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isPeekView?: boolean;
};

export const SidebarSections = observer(function SidebarSections(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, isPeekView = false } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { isMilestonesEnabled } = useMilestones();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { getIssueTypeById } = useIssueTypes();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);
  const hasCustomProperties = issue.type_id
    ? (getIssueTypeById(issue.type_id)?.activeProperties?.length ?? 0) > 0
    : false;
  const isReleasesFeatureEnabled =
    useFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES) &&
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_RELEASES_ENABLED);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-1 overflow-y-auto">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between w-full">
          <h5 className="text-body-sm-semibold text-primary">{t("common.properties")}</h5>
          {/* Compact updated-ago row */}
          {(issue.last_activity_at || issue.updated_at) && (
            <div className="flex items-center gap-1.5 text-caption-sm-regular text-tertiary">
              <span>Updated {calculateTimeAgo(issue.last_activity_at ?? issue.updated_at)}</span>
              <Tooltip
                tooltipContent={
                  <div className="flex flex-col gap-1.5 p-1">
                    {createdByDetails?.display_name && (
                      <div className="flex items-center gap-2">
                        <UserCirclePropertyIcon className="size-3.5 shrink-0 text-placeholder" />
                        <span className="text-caption-md-regular text-placeholder">
                          {t("common.created_by")} {createdByDetails.display_name}
                        </span>
                      </div>
                    )}
                    {issue.created_at && (
                      <div className="flex items-center gap-2">
                        <CreatedAtPropertyIcon className="size-3.5 shrink-0 text-placeholder" />
                        <span className="text-caption-md-regular text-placeholder">
                          {t("common.created_on")} {renderFormattedDateTime(issue.created_at, "MMM d, yyyy h:mma")}
                        </span>
                      </div>
                    )}
                    {(issue.last_activity_at ?? issue.updated_at) && (
                      <div className="flex items-center gap-2">
                        <UpdatedAtPropertyIcon className="size-3.5 shrink-0 text-placeholder" />
                        <span className="text-caption-md-regular text-placeholder">
                          {t("common.updated_on")}{" "}
                          {renderFormattedDateTime(issue.last_activity_at ?? issue.updated_at, "MMM d, yyyy h:mma")}
                        </span>
                      </div>
                    )}
                  </div>
                }
                position="bottom-end"
              >
                <span className="flex items-center">
                  <InfoIcon className="size-3.5 cursor-pointer" />
                </span>
              </Tooltip>
            </div>
          )}
        </div>
        <div className={cn("flex flex-col gap-5", { "opacity-60": !isEditable })}>
          {/* Details section */}
          <EntityDetailSidebarGroup label={t("common.details")}>
            <EntityDetailPropertyField icon={LabelPropertyIcon} label={t("common.labels")}>
              <IssueLabel
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={!isEditable}
              />
            </EntityDetailPropertyField>

            {projectId && areEstimateEnabledByProjectId(projectId) && (
              <EntityDetailPropertyField icon={EstimatePropertyIcon} label={t("common.estimate")}>
                <EstimateDropdown
                  value={issue?.estimate_point ?? undefined}
                  onChange={(val: string | undefined) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, {
                      estimate_point: val,
                    })
                  }
                  projectId={projectId}
                  disabled={!isEditable}
                  buttonVariant="transparent-with-text"
                  className="group w-full"
                  buttonContainerClassName="w-full text-left h-7.5 rounded-sm"
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                  buttonClassName={`text-body-xs-regular ${issue?.estimate_point !== null ? "" : "text-placeholder"}`}
                  placeholder={t("common.none")}
                  hideIcon
                  dropdownArrow
                />
              </EntityDetailPropertyField>
            )}

            <IssueWorklogProperty
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={!isEditable}
            />
          </EntityDetailSidebarGroup>

          <EntityDetailDivider />

          {/* Project structure section */}
          <EntityDetailSidebarGroup label={t("common.project_structure")}>
            {projectDetails?.cycle_view && (
              <EntityDetailPropertyField
                icon={CycleIcon}
                label={t("common.cycle")}
                appendElement={<TransferHopInfo workItem={issue} />}
              >
                <IssueCycleSelect
                  className="w-full grow h-7.5"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </EntityDetailPropertyField>
            )}

            {projectDetails?.module_view && (
              <EntityDetailPropertyField icon={ModuleIcon} label={t("common.modules")}>
                <IssueModuleSelect
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </EntityDetailPropertyField>
            )}

            {isCustomersFeatureEnabled && (
              <WorkItemSidebarCustomers workItemId={issueId} workspaceSlug={workspaceSlug} isPeekView={isPeekView} />
            )}

            {isMilestonesFeatureEnabled && (
              <WorkItemSideBarMilestoneItem
                projectId={projectId}
                milestoneId={issue.milestone_id}
                updateWorkItemMilestone={(milestoneId) =>
                  issueOperations.updateWorkItemMilestone?.(workspaceSlug, projectId, issueId, milestoneId)
                }
              />
            )}

            {isReleasesFeatureEnabled && (
              <EntityDetailPropertyField icon={ReleaseIcon} label={t("workspace_settings.settings.releases.title")}>
                <ReleaseSelect
                  workspaceSlug={workspaceSlug}
                  issueId={issueId}
                  onChange={(updatedIds) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, {
                      release_ids: updatedIds,
                    })
                  }
                  releaseIds={issue?.release_ids}
                  disabled={!isEditable}
                  className="group w-full grow h-7.5"
                  buttonVariant="transparent-with-text"
                  buttonContainerClassName="w-full text-left h-7.5"
                  dropdownArrow
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                  hideIcon
                />
              </EntityDetailPropertyField>
            )}
          </EntityDetailSidebarGroup>

          {/* Custom properties section */}
          {issue.type_id && hasCustomProperties && (
            <>
              <EntityDetailDivider />
              <EntityDetailSidebarGroup label={t("common.custom_properties")}>
                <WorkItemCustomPropertyValuesUpdate
                  issueId={issue.id}
                  issueTypeId={issue.type_id}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  isDisabled={!isEditable}
                />
              </EntityDetailSidebarGroup>
            </>
          )}

          {/* Audit metadata (flat, no accordion) */}
          <div className="flex flex-col gap-1 py-6">
            <AuditMetadataRows
              createdByName={createdByDetails?.display_name}
              createdAt={issue.created_at}
              updatedAt={issue.last_activity_at ?? issue.updated_at}
              completedAt={issue.completed_at}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
