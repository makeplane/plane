import { FC, useState } from "react";
import { observer } from "mobx-react";
import { LayoutPanelTop } from "lucide-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { renderFormattedPayloadDate, getDate, getTabIndex } from "@plane/utils";
// components
import {
  CycleDropdown,
  DateDropdown,
  EstimateDropdown,
  ModuleDropdown,
  PriorityDropdown,
  MemberDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { ParentIssuesListModal } from "@/components/issues";
import { IssueLabelSelect } from "@/components/issues/select";
// helpers
// hooks
import { useProjectEstimates } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TInboxIssueProperties = {
  projectId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  isVisible?: boolean;
};

export const InboxIssueProperties: FC<TInboxIssueProperties> = observer((props) => {
  const { projectId, data, handleData, isVisible = false } = props;
  // hooks
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { isMobile } = usePlatformOS();
  // states
  const [parentIssueModalOpen, setParentIssueModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | undefined>(undefined);

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);

  const startDate = data?.start_date;
  const targetDate = data?.target_date;

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="relative flex flex-wrap gap-2 items-center">
      {/* state */}
      <div className="h-7">
        <StateDropdown
          value={data?.state_id}
          onChange={(stateId) => handleData("state_id", stateId)}
          projectId={projectId}
          buttonVariant="border-with-text"
          tabIndex={getIndex("state_id")}
          isForWorkItemCreation={!data?.id}
        />
      </div>

      {/* priority */}
      <div className="h-7">
        <PriorityDropdown
          value={data?.priority}
          onChange={(priority) => handleData("priority", priority)}
          buttonVariant="border-with-text"
          tabIndex={getIndex("priority")}
        />
      </div>

      {/* Assignees */}
      <div className="h-7">
        <MemberDropdown
          projectId={projectId}
          value={data?.assignee_ids || []}
          onChange={(assigneeIds) => handleData("assignee_ids", assigneeIds)}
          buttonVariant={(data?.assignee_ids || [])?.length > 0 ? "transparent-without-text" : "border-with-text"}
          buttonClassName={(data?.assignee_ids || [])?.length > 0 ? "hover:bg-transparent" : ""}
          placeholder="Assignees"
          multiple
          tabIndex={getIndex("assignee_ids")}
        />
      </div>

      {/* labels */}
      <div className="h-7">
        <IssueLabelSelect
          setIsOpen={() => {}}
          value={data?.label_ids || []}
          onChange={(labelIds) => handleData("label_ids", labelIds)}
          projectId={projectId}
          tabIndex={getIndex("label_ids")}
        />
      </div>

      {/* start date */}
      {isVisible && (
        <div className="h-7">
          <DateDropdown
            value={data?.start_date || null}
            onChange={(date) => handleData("start_date", date ? renderFormattedPayloadDate(date) : "")}
            buttonVariant="border-with-text"
            minDate={minDate ?? undefined}
            placeholder="Start date"
            tabIndex={getIndex("start_date")}
          />
        </div>
      )}

      {/* due date */}
      <div className="h-7">
        <DateDropdown
          value={data?.target_date || null}
          onChange={(date) => handleData("target_date", date ? renderFormattedPayloadDate(date) : "")}
          buttonVariant="border-with-text"
          minDate={minDate ?? undefined}
          placeholder="Due date"
          tabIndex={getIndex("target_date")}
        />
      </div>

      {/* cycle */}
      {isVisible && (
        <div className="h-7">
          <CycleDropdown
            value={data?.cycle_id || ""}
            onChange={(cycleId) => handleData("cycle_id", cycleId)}
            projectId={projectId}
            placeholder="Cycle"
            buttonVariant="border-with-text"
            tabIndex={getIndex("cycle_id")}
          />
        </div>
      )}

      {/* module */}
      {isVisible && (
        <div className="h-7">
          <ModuleDropdown
            value={data?.module_ids || []}
            onChange={(moduleIds) => handleData("module_ids", moduleIds)}
            projectId={projectId}
            placeholder="Modules"
            buttonVariant="border-with-text"
            multiple
            showCount
            tabIndex={getIndex("module_ids")}
          />
        </div>
      )}

      {/* estimate */}
      {isVisible && projectId && areEstimateEnabledByProjectId(projectId) && (
        <div className="h-7">
          <EstimateDropdown
            value={data?.estimate_point || undefined}
            onChange={(estimatePoint) => handleData("estimate_point", estimatePoint)}
            projectId={projectId}
            buttonVariant="border-with-text"
            placeholder="Estimate"
            tabIndex={getIndex("estimate_point")}
          />
        </div>
      )}

      {/* add parent */}
      {isVisible && (
        <div className="h-7">
          {selectedParentIssue ? (
            <CustomMenu
              customButton={
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-between gap-1 h-full rounded border-[0.5px] border-custom-border-300 px-2 py-0.5 text-xs hover:bg-custom-background-80"
                >
                  <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {selectedParentIssue
                      ? `${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`
                      : `Add parent`}
                  </span>
                </button>
              }
              placement="bottom-start"
              className="h-full w-full"
              customButtonClassName="h-full"
              tabIndex={getIndex("parent_id")}
            >
              <>
                <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueModalOpen(true)}>
                  Change parent work item
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem
                  className="!p-1"
                  onClick={() => {
                    handleData("parent_id", "");
                    setSelectedParentIssue(undefined);
                  }}
                >
                  Remove parent work item
                </CustomMenu.MenuItem>
              </>
            </CustomMenu>
          ) : (
            <button
              type="button"
              className="flex cursor-pointer items-center justify-between gap-1 h-full rounded border-[0.5px] border-custom-border-300 px-2 py-0.5 text-xs hover:bg-custom-background-80"
              onClick={() => setParentIssueModalOpen(true)}
            >
              <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">Add parent</span>
            </button>
          )}

          <ParentIssuesListModal
            isOpen={parentIssueModalOpen}
            handleClose={() => setParentIssueModalOpen(false)}
            onChange={(issue) => {
              handleData("parent_id", issue?.id);
              setSelectedParentIssue(issue);
            }}
            projectId={projectId}
            issueId={undefined}
          />
        </div>
      )}
    </div>
  );
});
