import { FC } from "react";
import { observer } from "mobx-react-lite";
import { CalendarDays, Signal, Tag, Triangle, LayoutPanelTop } from "lucide-react";
// hooks
import { useIssueDetail, useProject } from "hooks/store";
// ui icons
import { DiceIcon, DoubleCircleIcon, UserGroupIcon, ContrastIcon } from "@plane/ui";
import {
  IssueLinkRoot,
  IssueCycleSelect,
  IssueModuleSelect,
  IssueParentSelect,
  IssueLabel,
  TIssueOperations,
} from "components/issues";
import { EstimateDropdown, PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// components
import { CustomDatePicker } from "components/ui";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;
  const projectDetails = getProjectById(issue.project_id);
  const isEstimateEnabled = projectDetails?.estimate;

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <>
      <div className="flex flex-col">
        <div className={`flex w-full flex-col gap-5 py-5 ${disabled ? "opacity-60" : ""}`}>
          {/* state */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
              <p>State</p>
            </div>
            <div>
              <StateDropdown
                value={issue?.state_id ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                projectId={projectId?.toString() ?? ""}
                disabled={disabled}
                buttonVariant="background-with-text"
              />
            </div>
          </div>

          {/* assignee */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <p>Assignees</p>
            </div>
            <div className="h-5 sm:w-1/2">
              <ProjectMemberDropdown
                value={issue?.assignee_ids ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                disabled={disabled}
                projectId={projectId?.toString() ?? ""}
                placeholder="Assignees"
                multiple
                buttonVariant={issue?.assignee_ids?.length > 0 ? "transparent-without-text" : "background-with-text"}
                buttonClassName={issue?.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
              />
            </div>
          </div>

          {/* priority */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <Signal className="h-4 w-4 flex-shrink-0" />
              <p>Priority</p>
            </div>
            <div className="h-5">
              <PriorityDropdown
                value={issue?.priority || undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                disabled={disabled}
                buttonVariant="background-with-text"
              />
            </div>
          </div>

          {/* estimate */}
          {isEstimateEnabled && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <Triangle className="h-4 w-4 flex-shrink-0 " />
                <p>Estimate</p>
              </div>
              <div>
                <EstimateDropdown
                  value={issue?.estimate_point || null}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })}
                  projectId={projectId}
                  disabled={disabled}
                  buttonVariant="background-with-text"
                />
              </div>
            </div>
          )}

          {/* start date */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Start date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date || undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { start_date: val })}
                className="border-none bg-custom-background-80"
                maxDate={maxDate ?? undefined}
                disabled={disabled}
              />
            </div>
          </div>

          {/* due date */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Due date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date || undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { target_date: val })}
                className="border-none bg-custom-background-80"
                minDate={minDate ?? undefined}
                disabled={disabled}
              />
            </div>
          </div>

          {/* parent */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
              <p>Parent</p>
            </div>
            <div>
              <IssueParentSelect
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className={`flex w-full flex-col gap-5 py-5 ${disabled ? "opacity-60" : ""}`}>
          {projectDetails?.cycle_view && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                <p>Cycle</p>
              </div>
              <div>
                <IssueCycleSelect
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {projectDetails?.module_view && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <DiceIcon className="h-4 w-4 flex-shrink-0" />
                <p>Module</p>
              </div>
              <div>
                <IssueModuleSelect
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          <div className="flex w-full items-start gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <p>Label</p>
            </div>
            <div className="flex w-full flex-col gap-3">
              <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="w-full pt-3">
          <IssueLinkRoot workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
        </div>
      </div>
    </>
  );
});
