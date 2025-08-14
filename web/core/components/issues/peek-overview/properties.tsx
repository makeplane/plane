"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Signal, Tag, Triangle, LayoutPanelTop, CalendarClock, CalendarCheck2, Users, UserCircle2, Info } from "lucide-react";
import axios from "axios";
// hooks
// ui icons
import { useTranslation } from "@plane/i18n";
import { DiceIcon, DoubleCircleIcon, ContrastIcon } from "@plane/ui";
// components
import {
  DateDropdown,
  EstimateDropdown,
  PriorityDropdown,
  MemberDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import {
  IssueCycleSelect,
  IssueModuleSelect,
  IssueParentSelect,
  IssueLabel,
  TIssueOperations,
  CustomProperties
} from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
import { useIssueDetail, useMember, useProject, useProjectState } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types/values";
import { IssueWorklogProperty} from "@/plane-web/components/issues";
import { ISSUE_ADDITIONAL_PROPERTIES } from "@/constants/issue";
import { CustomProperty } from "../custom-properties";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}


export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;
  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const customProperties = issue?.custom_properties || [];
  const issue_type_id = issue?.type_id || "";
  const isEstimateEnabled = projectDetails?.estimate;
  const stateDetails = getStateById(issue.state_id);
  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  const handleCustomPropertiesUpdate = async (updatedProperties: CustomProperty[]) => {
    try {
      const updateRequests = updatedProperties.map((property) => {
        const customPropertyId = property?.id || "";
        const apiUrl = `/api/workspaces/${workspaceSlug}/issues/${issueId}/custom-properties/`;
        if (customPropertyId) {
          return axios.patch(
            `${apiUrl}${customPropertyId}/`, 
            { value: property.value },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          return axios.post(
            apiUrl, 
            {
              key: property.key,
              value: property.value,
              issue_type_custom_property: property.issue_type_custom_property,
              data_type: property.data_type,
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
      });
      await Promise.all(updateRequests);
    } catch (error) {
    }
  };
  
  return (
    <div>
      <h6 className="text-sm font-medium">{t("properties")}</h6>
      {/* TODO: render properties using a common component */}
      <div className={`w-full space-y-2 mt-3 ${disabled ? "opacity-60" : ""}`}>
        {/* state */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>{t("state")}</span>
          </div>
          <StateDropdown
            value={issue?.state_id}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
            projectId={projectId}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName="text-sm"
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
          />
        </div>

        {/* assignee */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>{t("assignees")}</span>
          </div>
          <MemberDropdown
            value={issue?.assignee_ids ?? undefined}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
            disabled={disabled}
            projectId={projectId}
            placeholder="Add assignees"
            multiple
            buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm justify-between ${issue?.assignee_ids?.length > 0 ? "" : "text-custom-text-400"}`}
            hideIcon={issue.assignee_ids?.length === 0}
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
          />
        </div>

        {/* priority */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Signal className="h-4 w-4 flex-shrink-0" />
            <span>{t("priority")}</span>
          </div>
          <PriorityDropdown
            value={issue?.priority}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
            disabled={disabled}
            buttonVariant="border-with-text"
            className="w-3/4 flex-grow rounded px-2 hover:bg-custom-background-80 group"
            buttonContainerClassName="w-full text-left"
            buttonClassName="w-min h-auto whitespace-nowrap"
          />
        </div>

        {/* created by */}
        {createdByDetails && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <UserCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{t("created_by")} by</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
              <ButtonAvatars showTooltip userIds={createdByDetails?.id} />
              <span className="flex-grow truncate text-xs leading-5">{createdByDetails?.display_name}</span>
            </div>
          </div>
        )}

        {/* start date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>{t("start_date")}</span>
          </div>
          <DateDropdown
            value={issue.start_date}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            placeholder="Add start date"
            buttonVariant="transparent-with-text"
            maxDate={maxDate ?? undefined}
            disabled={disabled}
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
            // TODO: add this logic
            // showPlaceholderIcon
          />
        </div>

        {/* due date */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <CalendarCheck2 className="h-4 w-4 flex-shrink-0" />
            <span>{t("due_date")}</span>
          </div>
          <DateDropdown
            value={issue.target_date}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                target_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            placeholder="Add due date"
            buttonVariant="transparent-with-text"
            minDate={minDate ?? undefined}
            disabled={disabled}
            className="w-3/4 flex-grow group"
            buttonContainerClassName="w-full text-left"
            buttonClassName={cn("text-sm", {
              "text-custom-text-400": !issue.target_date,
              "text-red-500": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
            })}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline !text-custom-text-100"
            // TODO: add this logic
            // showPlaceholderIcon
          />
        </div>

        {/* estimate */}
        {isEstimateEnabled && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <Triangle className="h-4 w-4 flex-shrink-0" />
              <span>{t("estimate")}</span>
            </div>
            <EstimateDropdown
              value={issue.estimate_point ?? undefined}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })}
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-sm ${issue?.estimate_point !== undefined ? "" : "text-custom-text-400"}`}
              placeholder="None"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        )}

        {projectDetails?.module_view && (
          <div className="flex w-full items-center gap-3 min-h-8 h-full">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <DiceIcon className="h-4 w-4 flex-shrink-0" />
              <span>{t("modules")}</span>
            </div>
            <IssueModuleSelect
              className="w-3/4 flex-grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </div>
        )}

        {projectDetails?.cycle_view && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <ContrastIcon className="h-4 w-4 flex-shrink-0" />
              <span>{t("cycle")}</span>
            </div>
            <IssueCycleSelect
              className="w-3/4 flex-grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </div>
        )}

        {/* parent */}
        <div className="flex w-full items-center gap-3 h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
            <p>{t("parent")}</p>
          </div>
          <IssueParentSelect
            className="w-3/4 flex-grow h-full"
            disabled={disabled}
            issueId={issueId}
            issueOperations={issueOperations}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        </div>

        {/* label */}
        <div className="flex w-full items-center gap-3 min-h-8">
          <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>{t("labels")}</span>
          </div>
          <div className="flex w-full flex-col gap-3 truncate">
            <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
          </div>
        </div>

        <IssueWorklogProperty
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />

        {issue.type_id && (
          <IssueAdditionalPropertyValuesUpdate
            issueId={issueId}
            issueTypeId={issue.type_id}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            isDisabled={disabled}
          />
        )}

        {ISSUE_ADDITIONAL_PROPERTIES.map((prop: any) =>
          issue[prop.key] ? (
            <div key={prop?.key} className="flex w-full items-center gap-3 h-8">
              <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>{t(prop?.key)}</span>
              </div>
              <div className="w-3/4 flex-grow group ml-2 text-sm">{issue[prop.key]}</div>
            </div>
          ) : null
        )}

        <CustomProperties
          customProperties={Array.isArray(customProperties) ? customProperties : []}
          issue_type_id={issue_type_id}
          workspaceSlug={workspaceSlug}
          updateCustomProperties={handleCustomPropertiesUpdate}
          layout="quarter"
        />
      </div>
    </div>
  );
});
