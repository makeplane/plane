import { observer } from "mobx-react";
import {
  StatePropertyIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  DueDatePropertyIcon,
  LabelPropertyIcon,
  DuplicatePropertyIcon,
} from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TInboxDuplicateIssueDetails, TIssue } from "@plane/types";
import { ControlLink } from "@plane/ui";
import { getDate, renderFormattedPayloadDate, generateWorkItemLink } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { IntakeStateDropdown } from "@/components/dropdowns/intake-state/dropdown";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueLabel } from "@/components/issues/issue-detail/label";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issue: Partial<TIssue>;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  duplicateIssueDetails: TInboxDuplicateIssueDetails | undefined;
  isIntakeAccepted: boolean;
};

export const InboxIssueContentProperties = observer(function InboxIssueContentProperties(props: Props) {
  const { workspaceSlug, projectId, issue, issueOperations, isEditable, duplicateIssueDetails, isIntakeAccepted } =
    props;

  const router = useAppRouter();
  // store hooks
  const { currentProjectDetails } = useProject();

  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());
  if (!issue || !issue?.id) return <></>;

  const duplicateWorkItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId,
    issueId: duplicateIssueDetails?.id,
    projectIdentifier: currentProjectDetails?.identifier,
    sequenceId: duplicateIssueDetails?.sequence_id,
  });
  const DropdownComponent = isIntakeAccepted ? StateDropdown : IntakeStateDropdown;

  return (
    <div className="flex w-full flex-col divide-y-2 divide-subtle-1">
      <div className="w-full overflow-y-auto">
        <h5 className="text-body-sm-medium mb-2">Properties</h5>
        <div className={`divide-y-2 divide-subtle-1 ${!isEditable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Intake State */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <StatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              {issue?.state_id && (
                <DropdownComponent
                  value={issue?.state_id}
                  onChange={() => {}}
                  projectId={projectId?.toString() ?? ""}
                  disabled
                  buttonVariant="transparent-with-text"
                  className="w-3/5 flex-grow group"
                  buttonContainerClassName="w-full text-left"
                  buttonClassName="text-13"
                  dropdownArrow
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                />
              )}
            </div>
            {/* Assignee */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <MembersPropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Assignees</span>
              </div>
              <MemberDropdown
                value={issue?.assignee_ids ?? []}
                onChange={(val) =>
                  issue?.id && issueOperations.update(workspaceSlug, projectId, issue?.id, { assignee_ids: val })
                }
                disabled={!isEditable}
                projectId={projectId?.toString() ?? ""}
                placeholder="Add assignees"
                multiple
                buttonVariant={
                  (issue?.assignee_ids || [])?.length > 0 ? "transparent-without-text" : "transparent-with-text"
                }
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-13 justify-between ${
                  (issue?.assignee_ids || [])?.length > 0 ? "" : "text-placeholder"
                }`}
                hideIcon={issue.assignee_ids?.length === 0}
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>
            {/* Priority */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <PriorityPropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={issue?.priority}
                onChange={(val) =>
                  issue?.id && issueOperations.update(workspaceSlug, projectId, issue?.id, { priority: val })
                }
                disabled={!isEditable}
                buttonVariant="border-with-text"
                className="w-3/5 flex-grow rounded-sm px-2 hover:bg-layer-1"
                buttonContainerClassName="w-full text-left"
                buttonClassName="w-min h-auto whitespace-nowrap"
              />
            </div>
          </div>
        </div>
        <div className={`divide-y-2 divide-subtle-1 mt-3 ${!isEditable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Due Date */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <DueDatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <DateDropdown
                placeholder="Add due date"
                value={issue.target_date || null}
                onChange={(val) =>
                  issue?.id &&
                  issueOperations.update(workspaceSlug, projectId, issue?.id, {
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                minDate={minDate ?? undefined}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-13 ${issue?.target_date ? "" : "text-placeholder"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
              />
            </div>
            {/* Labels */}
            <div className="flex min-h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <LabelPropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Labels</span>
              </div>
              <div className="w-3/5 flex-grow min-h-8 h-full pt-1">
                {issue?.id && (
                  <IssueLabel
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    issueId={issue?.id}
                    disabled={!isEditable}
                    isInboxIssue
                    onLabelUpdate={(val: string[]) =>
                      issue?.id && issueOperations.update(workspaceSlug, projectId, issue?.id, { label_ids: val })
                    }
                  />
                )}
              </div>
            </div>

            {/* duplicate to*/}
            {duplicateIssueDetails && (
              <div className="flex min-h-8 gap-2">
                <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-13 text-tertiary">
                  <DuplicatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Duplicate of</span>
                </div>

                <ControlLink
                  href={duplicateWorkItemLink}
                  onClick={() => {
                    router.push(duplicateWorkItemLink);
                  }}
                  target="_self"
                >
                  <Tooltip tooltipContent={`${duplicateIssueDetails?.name}`}>
                    <span className="flex items-center gap-1 cursor-pointer text-11 rounded-sm px-1.5 py-1 pb-0.5 bg-layer-1 text-secondary">
                      {`${currentProjectDetails?.identifier}-${duplicateIssueDetails?.sequence_id}`}
                    </span>
                  </Tooltip>
                </ControlLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
