import { FC, useState } from "react";
// ui icons
import { DiceIcon, DoubleCircleIcon, UserGroupIcon } from "@plane/ui";
import { CalendarDays, ContrastIcon, Link2, Plus, Signal, Tag, Triangle, User2 } from "lucide-react";
import {
  SidebarAssigneeSelect,
  SidebarCycleSelect,
  SidebarEstimateSelect,
  SidebarLabelSelect,
  SidebarModuleSelect,
  SidebarParentSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
} from "../sidebar-select";
// components
import { CustomDatePicker } from "components/ui";
import { LinkModal, LinksList } from "components/core";
// types
import { ICycle, IIssue, IModule, TIssuePriorities, linkDetails } from "types";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";

interface IPeekOverviewProperties {
  issue: IIssue;
  issueUpdate: (issue: Partial<IIssue>) => void;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = (props) => {
  const { issue, issueUpdate } = props;
  const [linkModal, setLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<linkDetails | null>(null);

  const handleState = (_state: string) => {
    issueUpdate({ ...issue, state: _state });
  };

  const handlePriority = (_priority: TIssuePriorities) => {
    issueUpdate({ ...issue, priority: _priority });
  };

  const handleAssignee = (_assignees: string[]) => {
    issueUpdate({ ...issue, assignees: _assignees });
  };
  const handleEstimate = (_estimate: number | null) => {
    issueUpdate({ ...issue, estimate_point: _estimate });
  };

  const handleStartDate = (_startDate: string | null) => {
    issueUpdate({ ...issue, start_date: _startDate });
  };

  const handleTargetDate = (_targetDate: string | null) => {
    issueUpdate({ ...issue, target_date: _targetDate });
  };
  const handleParent = (_parent: string) => {
    issueUpdate({ ...issue, parent: _parent });
  };
  const handleCycle = (_cycle: ICycle) => {
    console.log("_cycle", _cycle);
    // issueUpdate({ ...issue, cycle: _cycle });
  };
  const handleModule = (_module: IModule) => {
    console.log("_module", _module);
    // issueUpdate({ ...issue, parent: _module });
  };
  const handleLabels = (_labels: any) => {
    console.log("_labels", _labels);
    // issueUpdate({ ...issue, parent: _module });
  };

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const { memberRole } = useProjectMyMembership();

  const handleEditLink = () => {
    console.log("edit");
  };
  const handleDeleteLink = async () => {
    console.log("delete");
  };

  const handleCreateLink = async () => {
    console.log("create");
  };

  const handleUpdateLink = async () => {
    console.log("update");
  };

  return (
    <>
      <LinkModal
        isOpen={linkModal}
        handleClose={() => {
          setLinkModal(false);
          setSelectedLinkToUpdate(null);
        }}
        data={selectedLinkToUpdate}
        status={selectedLinkToUpdate ? true : false}
        createIssueLink={handleCreateLink}
        updateIssueLink={handleUpdateLink}
      />
      <div className="flex flex-col pt-5">
        <div className="flex flex-col gap-5 py-5 w-80">
          {/* state */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
              <p>State</p>
            </div>
            <div>
              <SidebarStateSelect
                value={issue?.state || ""}
                onChange={handleState}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* assignee */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <p>Assignees</p>
            </div>
            <div>
              <SidebarAssigneeSelect
                value={issue.assignees || []}
                onChange={handleAssignee}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* priority */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <Signal className="h-4 w-4 flex-shrink-0" />
              <p>Priority</p>
            </div>
            <div>
              <SidebarPrioritySelect
                value={issue.priority || ""}
                onChange={handlePriority}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* estimate */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <Triangle className="h-4 w-4 flex-shrink-0 " />
              <p>Estimate</p>
            </div>
            <div>
              <SidebarEstimateSelect
                value={issue.estimate_point}
                onChange={handleEstimate}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* start date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Start date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date}
                onChange={handleStartDate}
                className="bg-custom-background-80 border-none"
                maxDate={maxDate ?? undefined}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* due date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Due date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date}
                onChange={handleTargetDate}
                className="bg-custom-background-80 border-none"
                minDate={minDate ?? undefined}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          {/* parent */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <User2 className="h-4 w-4 flex-shrink-0" />
              <p>Parent</p>
            </div>
            <div>
              <SidebarParentSelect
                onChange={handleParent}
                issueDetails={issue}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 py-5 w-80">
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <ContrastIcon className="h-4 w-4 flex-shrink-0" />
              <p>Cycle</p>
            </div>
            <div>
              <SidebarCycleSelect
                issueDetail={issue}
                handleCycleChange={handleCycle}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2">
              <DiceIcon className="h-4 w-4 flex-shrink-0" />
              <p>Module</p>
            </div>
            <div>
              <SidebarModuleSelect
                issueDetail={issue}
                handleModuleChange={handleModule}
                disabled={false}
                // disabled={memberRole.isGuest || memberRole.isViewer || uneditable}
              />
            </div>
          </div>
          <div className="flex items-start gap-2 w-full">
            <div className="flex items-center gap-2 w-1/2 flex-shrink-0">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <p>Label</p>
            </div>
            <div className="max-w-1/2">
              <SidebarLabelSelect
                issueDetails={issue}
                labelList={issue.labels_list}
                submitChanges={handleLabels}
                isNotAllowed={false}
                uneditable={false}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 pt-5 w-80">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2 w-1/2">
                <Link2 className="h-4 w-4 rotate-45 flex-shrink-0" />
                <p>Links</p>
              </div>
              <div>
                {!false && (
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-90 ${
                      false ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                    onClick={() => setLinkModal(true)}
                    disabled={false}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {issue?.issue_link && issue.issue_link.length > 0 ? (
                <LinksList
                  links={issue.issue_link}
                  handleDeleteLink={handleDeleteLink}
                  handleEditLink={handleEditLink}
                  userAuth={memberRole}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
