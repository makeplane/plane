"use client";

import React from "react";
import { observer } from "mobx-react";
import { CalendarCheck2, CalendarClock, LayoutPanelTop, Signal, Tag, Triangle, UserCircle2, Users, Info } from "lucide-react";
import axios from "axios";
// ui
import { ContrastIcon, DiceIcon, DoubleCircleIcon } from "@plane/ui";
// components
import {
  DateDropdown,
  EstimateDropdown,
  MemberDropdown,
  PriorityDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { IssueCycleSelect, IssueLabel, IssueModuleSelect, IssueParentSelect, CustomProperties} from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "@/helpers/issue.helper";
// hooks
import { useProjectEstimates, useIssueDetail, useProject, useProjectState, useMember } from "@/hooks/store";
// plane web components
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types/values";
import { IssueWorklogProperty } from "@/plane-web/components/issues";
// components
import type { TIssueOperations } from "./root";
import { ISSUE_ADDITIONAL_PROPERTIES } from "@/constants/issue";
import { CustomProperty } from "../custom-properties";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

export const IssueDetailsSidebar: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue.created_by);

  // derived values
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);
  const customProperties = issue?.custom_properties || [];
  const issue_type_id = issue?.issue_type_id || "afd30f86-5ae5-428c-aa3a-e633ea973740";
  console.log("issue_type_id in sidebar.tsx is", issue_type_id);
  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? getDate(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleCustomPropertiesUpdate = async (updatedProperties: CustomProperty[]) => {
    try {
      console.log("Updating custom properties", updatedProperties);
  
      // Create the necessary data for the API call
      const updateRequests = updatedProperties.map((property) => {
        const customPropertyId = property?.id || "";
        // const issueIdHardCode = "0d41ef0f-4267-46b6-9ce7-ec207431a1d7";
        const apiUrl = `/api/v1/workspaces/${workspaceSlug}/issues/${issueId}/custom-properties/`;

        // If an ID exists, we PATCH the existing property
        if (customPropertyId) {
          return axios.patch(
            `${apiUrl}${customPropertyId}/`, 
            { value: property.value },
            {
              headers: {
                'x-api-key': 'TEST_API_TOKEN',
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          // If no ID exists, we POST to create a new custom property
          return axios.post(
            apiUrl, 
            {
              key: property.key,
              value: property.value,
              issue_type_custom_property: property.issue_type_custom_property, // Include this if needed
            },
            {
              headers: {
                'x-api-key': 'TEST_API_TOKEN',
                'Content-Type': 'application/json'
              }
            }
          );
        }
      });
  
      // Wait for all requests to complete
      await Promise.all(updateRequests);
  
      console.log("Custom properties updated successfully");
      // Optionally, you can refresh the custom properties after the update
      // You can either trigger a re-fetch from the server or update the local state
    } catch (error) {
      console.error("Error updating custom properties:", error);
    }
  };

  return (
    <>
      <div className="flex items-center h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
        <div className="h-full w-full overflow-y-auto px-6">
          <h5 className="mt-6 text-sm font-medium">Properties</h5>
          {/* TODO: render properties using a common component */}
          <div className={`mb-2 mt-3 space-y-2.5 ${!isEditable ? "opacity-60" : ""}`}>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              <StateDropdown
                value={issue?.state_id}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                projectId={projectId?.toString() ?? ""}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName="text-sm"
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>Assignees</span>
              </div>
              <MemberDropdown
                value={issue?.assignee_ids ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                disabled={!isEditable}
                projectId={projectId?.toString() ?? ""}
                placeholder="Add assignees"
                multiple
                buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm justify-between ${
                  issue?.assignee_ids?.length > 0 ? "" : "text-custom-text-400"
                }`}
                hideIcon={issue.assignee_ids?.length === 0}
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <Signal className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={issue?.priority}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                disabled={!isEditable}
                buttonVariant="border-with-text"
                className="w-3/5 flex-grow rounded px-2 hover:bg-custom-background-80"
                buttonContainerClassName="w-full text-left"
                buttonClassName="w-min h-auto whitespace-nowrap"
              />
            </div>

            {createdByDetails && (
              <div className="flex h-8 items-center gap-2">
                <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                  <UserCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Created by</span>
                </div>
                <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="flex-grow truncate text-xs leading-5">{createdByDetails?.display_name}</span>
                </div>
              </div>
            )}

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span>Start date</span>
              </div>
              <DateDropdown
                placeholder="Add start date"
                value={issue.start_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    start_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                maxDate={maxDate ?? undefined}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
                // TODO: add this logic
                // showPlaceholderIcon
              />
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <CalendarCheck2 className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <DateDropdown
                placeholder="Add due date"
                value={issue.target_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                minDate={minDate ?? undefined}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
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

            {projectId && areEstimateEnabledByProjectId(projectId) && (
              <div className="flex h-8 items-center gap-2">
                <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                  <Triangle className="h-4 w-4 flex-shrink-0" />
                  <span>Estimate</span>
                </div>
                <EstimateDropdown
                  value={issue?.estimate_point ?? undefined}
                  onChange={(val: string | undefined) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })
                  }
                  projectId={projectId}
                  disabled={!isEditable}
                  buttonVariant="transparent-with-text"
                  className="group w-3/5 flex-grow"
                  buttonContainerClassName="w-full text-left"
                  buttonClassName={`text-sm ${issue?.estimate_point !== null ? "" : "text-custom-text-400"}`}
                  placeholder="None"
                  hideIcon
                  dropdownArrow
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                />
              </div>
            )}

            {projectDetails?.module_view && (
              <div className="flex min-h-8 gap-2">
                <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
                  <DiceIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Modules</span>
                </div>
                <IssueModuleSelect
                  className="w-3/5 flex-grow"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </div>
            )}

            {projectDetails?.cycle_view && (
              <div className="flex h-8 items-center gap-2">
                <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                  <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Cycle</span>
                </div>
                <IssueCycleSelect
                  className="w-3/5 flex-grow"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </div>
            )}

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
                <span>Parent</span>
              </div>
              <IssueParentSelect
                className="h-full w-3/5 flex-grow"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={!isEditable}
              />
            </div>

            <div className="flex min-h-8 gap-2">
              <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>Labels</span>
              </div>
              <div className="h-full min-h-8 w-3/5 flex-grow">
                <IssueLabel
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  disabled={!isEditable}
                />
              </div>
            </div>
            
            <IssueWorklogProperty
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={!isEditable}
            />

            {issue.type_id && (
              <IssueAdditionalPropertyValuesUpdate
                issueId={issueId}
                issueTypeId={issue.type_id}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isDisabled={!isEditable}
              />
            )}

            {ISSUE_ADDITIONAL_PROPERTIES.map((prop: any) =>
              issue[prop.key] ? (
                <div key={prop?.key} className="flex min-h-8 gap-2 align-items-center">
                  <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{prop?.title}</span>
                  </div>
                  <div className="h-full min-h-8 w-3/5 mt-1 ml-5 flex-grow">
                    <span className="text-sm">{issue[prop.key]}</span>
                  </div>
                </div>
              ) : null
            )}

            <CustomProperties
              customProperties={Array.isArray(customProperties) ? customProperties : []}
              issue_type_id={issue_type_id}
              workspaceSlug={workspaceSlug}
              updateCustomProperties={handleCustomPropertiesUpdate}
            />
          </div>
        </div>
      </div>
    </>
  );
});
