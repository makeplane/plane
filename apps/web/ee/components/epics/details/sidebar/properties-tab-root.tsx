"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import { CalendarCheck2, CalendarClock, Signal, Tag, Triangle, UserCircle2, Users } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// ui
import { DoubleCircleIcon, InitiativeIcon } from "@plane/ui";
// components
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
import {
  DateDropdown,
  EstimateDropdown,
  MemberDropdown,
  PriorityDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { IssueLabel } from "@/components/issues";
// helpers
import { useIssueDetail, useMember, useProjectEstimates, useProjectState } from "@/hooks/store";
// plane web components
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { InitiativeMultiSelectModal } from "@/plane-web/components/initiatives/common/multi-select-modal";
import { IssueAdditionalPropertyValuesUpdate } from "@/plane-web/components/issue-types/values/addition-properties-update";
// helpers
import { WorkItemSidebarCustomers } from "@/plane-web/components/issues/issue-details/sidebar/customer-list-root";
import { useCustomers } from "@/plane-web/hooks/store/customers";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useEpicOperations } from "../helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicSidebarPropertiesRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  const { isCustomersFeatureEnabled } = useCustomers();
  const {
    initiative: { isInitiativeModalOpen, toggleInitiativeModal },
  } = useInitiatives();
  const { t } = useTranslation();

  // derived values
  const issue = getIssueById(epicId);

  const epicOperations = useEpicOperations();

  if (!issue) return <></>;

  // derived values
  const createdByDetails = getUserDetails(issue.created_by);
  const stateDetails = getStateById(issue.state_id);

  // min and max date for start and target date
  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? getDate(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <SidebarContentWrapper title="Properties">
      <InitiativeMultiSelectModal
        isOpen={isInitiativeModalOpen === epicId}
        onClose={() => toggleInitiativeModal()}
        selectedInitiativeIds={issue.initiative_ids ?? []}
        onSubmit={(initiativeIds) =>
          epicOperations.update(workspaceSlug, projectId, epicId, { initiative_ids: initiativeIds })
        }
      />
      <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>State</span>
          </div>
          <StateDropdown
            value={issue?.state_id}
            onChange={(val) => epicOperations.update(workspaceSlug, projectId, epicId, { state_id: val })}
            projectId={projectId?.toString() ?? ""}
            disabled={disabled}
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
            onChange={(val) => epicOperations.update(workspaceSlug, projectId, epicId, { assignee_ids: val })}
            disabled={disabled}
            projectId={projectId?.toString() ?? ""}
            placeholder="Add assignees"
            multiple
            buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
            className="group w-3/5 flex-grow"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm justify-between ${issue?.assignee_ids?.length > 0 ? "" : "text-custom-text-400"}`}
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
            onChange={(val) => epicOperations.update(workspaceSlug, projectId, epicId, { priority: val })}
            disabled={disabled}
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
            <InitiativeIcon className="h-4 w-4 flex-shrink-0" />
            <span>Initiatives</span>
          </div>
          <div
            className={cn(
              "p-2 rounded text-sm text-custom-text-200 hover:bg-custom-background-80 justify-start flex items-start cursor-pointer",
              {
                "text-custom-text-400": !issue.initiative_ids?.length,
              }
            )}
            onClick={() => toggleInitiativeModal(epicId)}
          >
            {issue.initiative_ids?.length
              ? t("initiatives.placeholder", { count: issue.initiative_ids?.length })
              : t("initiatives.add_initiative")}
          </div>
        </div>
        <div className="flex h-8 items-center gap-2">
          <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
            <CalendarClock className="h-4 w-4 flex-shrink-0" />
            <span>Start date</span>
          </div>
          <DateDropdown
            placeholder="Add start date"
            value={issue.start_date}
            onChange={(val) =>
              epicOperations.update(workspaceSlug, projectId, epicId, {
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            maxDate={maxDate ?? undefined}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="group w-3/5 flex-grow"
            buttonContainerClassName="w-full text-left"
            buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
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
              epicOperations.update(workspaceSlug, projectId, epicId, {
                target_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            minDate={minDate ?? undefined}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="group w-3/5 flex-grow"
            buttonContainerClassName="w-full text-left"
            buttonClassName={cn("text-sm", {
              "text-custom-text-400": !issue.target_date,
              "text-red-500": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
            })}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline !text-custom-text-100"
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
                epicOperations.update(workspaceSlug, projectId, epicId, { estimate_point: val })
              }
              projectId={projectId}
              disabled={disabled}
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

        <div className="flex min-h-8 gap-2">
          <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
            <Tag className="h-4 w-4 flex-shrink-0" />
            <span>Labels</span>
          </div>
          <div className="h-full min-h-8 w-3/5 flex-grow">
            <IssueLabel
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={epicId}
              disabled={disabled}
              issueServiceType={EIssueServiceType.EPICS}
            />
          </div>
        </div>

        {isCustomersFeatureEnabled && (
          <WorkItemSidebarCustomers workItemId={epicId} workspaceSlug={workspaceSlug} isPeekView={false} />
        )}

        {issue.type_id && (
          <IssueAdditionalPropertyValuesUpdate
            issueId={epicId}
            issueTypeId={issue.type_id}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            isDisabled={disabled}
            entityType={EWorkItemTypeEntity.EPIC}
            issueServiceType={EIssueServiceType.EPICS}
          />
        )}
      </div>
    </SidebarContentWrapper>
  );
});
