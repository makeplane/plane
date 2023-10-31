import { FC, useState } from "react";
import { mutate } from "swr";
import { useRouter } from "next/router";

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
// hooks
import useToast from "hooks/use-toast";

// components
import { CustomDatePicker } from "components/ui";
import { LinkModal, LinksList } from "components/core";
// types
import { ICycle, IIssue, IIssueLink, IModule, TIssuePriorities, linkDetails } from "types";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
import { ISSUE_DETAILS } from "constants/fetch-keys";

// services
import { IssueService } from "services/issue";

interface IPeekOverviewProperties {
  issue: IIssue;
  issueUpdate: (issue: Partial<IIssue>) => void;
  user: any;
}

const issueService = new IssueService();

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = (props) => {
  const { issue, issueUpdate, user } = props;
  const [linkModal, setLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<linkDetails | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { memberRole } = useProjectMyMembership();

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
    issueUpdate({ ...issue, cycle: _cycle.id });
  };
  const handleModule = (_module: IModule) => {
    issueUpdate({ ...issue, module: _module.id });
  };
  const handleLabels = (formData: Partial<IIssue>) => {
    issueUpdate({ ...issue, ...formData });
  };

  const handleCreateLink = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { metadata: {}, ...formData };

    await issueService
      .createIssueLink(workspaceSlug as string, projectId as string, issue.id, payload)
      .then(() => mutate(ISSUE_DETAILS(issue.id)))
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "This URL already exists for this issue.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
      });
  };

  const handleUpdateLink = async (formData: IIssueLink, linkId: string) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { metadata: {}, ...formData };

    const updatedLinks = issue.issue_link.map((l) =>
      l.id === linkId
        ? {
            ...l,
            title: formData.title,
            url: formData.url,
          }
        : l
    );

    mutate<IIssue>(
      ISSUE_DETAILS(issue.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issueService
      .updateIssueLink(workspaceSlug as string, projectId as string, issue.id, linkId, payload)
      .then(() => {
        mutate(ISSUE_DETAILS(issue.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleEditLink = (link: linkDetails) => {
    setSelectedLinkToUpdate(link);
    setLinkModal(true);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const updatedLinks = issue.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(issue.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issueService
      .deleteIssueLink(workspaceSlug as string, projectId as string, issue.id, linkId)
      .then(() => {
        mutate(ISSUE_DETAILS(issue.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const isNotAllowed = user?.memberRole?.isGuest || user?.memberRole?.isViewer;

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
      <div className="flex flex-col">
        <div className="flex flex-col gap-5 py-5 w-full">
          {/* state */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
              <p>State</p>
            </div>
            <div>
              <SidebarStateSelect value={issue?.state || ""} onChange={handleState} disabled={isNotAllowed} />
            </div>
          </div>

          {/* assignee */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <p>Assignees</p>
            </div>
            <div>
              <SidebarAssigneeSelect value={issue.assignees || []} onChange={handleAssignee} disabled={isNotAllowed} />
            </div>
          </div>

          {/* priority */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <Signal className="h-4 w-4 flex-shrink-0" />
              <p>Priority</p>
            </div>
            <div>
              <SidebarPrioritySelect value={issue.priority || ""} onChange={handlePriority} disabled={isNotAllowed} />
            </div>
          </div>

          {/* estimate */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <Triangle className="h-4 w-4 flex-shrink-0 " />
              <p>Estimate</p>
            </div>
            <div>
              <SidebarEstimateSelect value={issue.estimate_point} onChange={handleEstimate} disabled={isNotAllowed} />
            </div>
          </div>

          {/* start date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Start date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date}
                onChange={handleStartDate}
                className="bg-custom-background-80 border-none !px-2.5 !py-0.5"
                maxDate={maxDate ?? undefined}
                disabled={isNotAllowed}
              />
            </div>
          </div>

          {/* due date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Due date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date}
                onChange={handleTargetDate}
                className="bg-custom-background-80 border-none !px-2.5 !py-0.5"
                minDate={minDate ?? undefined}
                disabled={isNotAllowed}
              />
            </div>
          </div>

          {/* parent */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40">
              <User2 className="h-4 w-4 flex-shrink-0" />
              <p>Parent</p>
            </div>
            <div>
              <SidebarParentSelect onChange={handleParent} issueDetails={issue} disabled={isNotAllowed} />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 py-5 w-full">
          <div className="flex items-center gap-2 w-80">
            <div className="flex items-center gap-2 w-40">
              <ContrastIcon className="h-4 w-4 flex-shrink-0" />
              <p>Cycle</p>
            </div>
            <div>
              <SidebarCycleSelect issueDetail={issue} handleCycleChange={handleCycle} disabled={isNotAllowed} />
            </div>
          </div>

          <div className="flex items-center gap-2 w-80">
            <div className="flex items-center gap-2 w-40">
              <DiceIcon className="h-4 w-4 flex-shrink-0" />
              <p>Module</p>
            </div>
            <div>
              <SidebarModuleSelect issueDetail={issue} handleModuleChange={handleModule} disabled={isNotAllowed} />
            </div>
          </div>
          <div className="flex items-start gap-2 w-full">
            <div className="flex items-center gap-2 w-40 flex-shrink-0">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <p>Label</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <SidebarLabelSelect
                issueDetails={issue}
                labelList={issue.labels}
                submitChanges={handleLabels}
                isNotAllowed={isNotAllowed}
                uneditable={isNotAllowed}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 pt-5 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-80">
              <div className="flex items-center gap-2 w-40">
                <Link2 className="h-4 w-4 rotate-45 flex-shrink-0" />
                <p>Links</p>
              </div>
              <div>
                {!isNotAllowed && (
                  <button
                    type="button"
                    className={`flex ${
                      isNotAllowed ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-90"
                    } items-center gap-1 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs hover:text-custom-text-200 text-custom-text-300`}
                    onClick={() => setLinkModal(true)}
                    disabled={false}
                  >
                    <Plus className="h-3 w-3" /> New
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
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
