import { FC, useState } from "react";
import { mutate } from "swr";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui icons
import { DiceIcon, DoubleCircleIcon, UserGroupIcon, ContrastIcon } from "@plane/ui";
import { CalendarDays, Link2, Plus, Signal, Tag, Triangle, LayoutPanelTop } from "lucide-react";
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
// services
import { IssueService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// components
import { CustomDatePicker } from "components/ui";
import { LinkModal, LinksList } from "components/core";
// types
import { IIssue, IIssueLink, TIssuePriorities, ILinkDetails } from "types";
// fetch-keys
import { ISSUE_DETAILS } from "constants/fetch-keys";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

interface IPeekOverviewProperties {
  issue: IIssue;
  issueUpdate: (issue: Partial<IIssue>) => void;
  disableUserActions: boolean;
}

const issueService = new IssueService();

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { issue, issueUpdate, disableUserActions } = props;
  // states
  const [linkModal, setLinkModal] = useState(false);
  const [selectedLinkToUpdate, setSelectedLinkToUpdate] = useState<ILinkDetails | null>(null);

  const {
    user: { currentProjectRole },
    cycleIssues: { addIssueToCycle },
    moduleIssues: { addIssueToModule },
  } = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

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
  const handleAddIssueToCycle = async (cycleId: string) => {
    if (!workspaceSlug || !issue || !cycleId) return;

    addIssueToCycle(workspaceSlug.toString(), cycleId, [issue.id]);
  };

  const handleAddIssueToModule = async (moduleId: string) => {
    if (!workspaceSlug || !issue || !moduleId) return;

    addIssueToModule(workspaceSlug.toString(), moduleId, [issue.id]);
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

  const handleEditLink = (link: ILinkDetails) => {
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
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
              <p>State</p>
            </div>
            <div>
              <SidebarStateSelect value={issue?.state || ""} onChange={handleState} disabled={disableUserActions} />
            </div>
          </div>

          {/* assignee */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <p>Assignees</p>
            </div>
            <div>
              <SidebarAssigneeSelect
                value={issue.assignees || []}
                onChange={handleAssignee}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* priority */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <Signal className="h-4 w-4 flex-shrink-0" />
              <p>Priority</p>
            </div>
            <div>
              <SidebarPrioritySelect
                value={issue.priority || ""}
                onChange={handlePriority}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* estimate */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <Triangle className="h-4 w-4 flex-shrink-0 " />
              <p>Estimate</p>
            </div>
            <div>
              <SidebarEstimateSelect
                value={issue.estimate_point}
                onChange={handleEstimate}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* start date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Start date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date}
                onChange={handleStartDate}
                className="bg-custom-background-80 !rounded border-none !px-2.5 !py-0.5"
                maxDate={maxDate ?? undefined}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* due date */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Due date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date}
                onChange={handleTargetDate}
                className="bg-custom-background-80 !rounded border-none !px-2.5 !py-0.5"
                minDate={minDate ?? undefined}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* parent */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
              <p>Parent</p>
            </div>
            <div>
              <SidebarParentSelect onChange={handleParent} issueDetails={issue} disabled={disableUserActions} />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 py-5 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <ContrastIcon className="h-4 w-4 flex-shrink-0" />
              <p>Cycle</p>
            </div>
            <div>
              <SidebarCycleSelect
                issueDetail={issue}
                handleCycleChange={handleAddIssueToCycle}
                disabled={disableUserActions}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <DiceIcon className="h-4 w-4 flex-shrink-0" />
              <p>Module</p>
            </div>
            <div>
              <SidebarModuleSelect
                issueDetail={issue}
                handleModuleChange={handleAddIssueToModule}
                disabled={disableUserActions}
              />
            </div>
          </div>
          <div className="flex items-start gap-2 w-full">
            <div className="flex items-center gap-2 w-40 text-sm flex-shrink-0">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <p>Label</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <SidebarLabelSelect
                issueDetails={issue}
                labelList={issue.labels}
                submitChanges={handleLabels}
                isNotAllowed={disableUserActions}
                uneditable={disableUserActions}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex flex-col gap-5 pt-5 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-80">
              <div className="flex items-center gap-2 w-40 text-sm">
                <Link2 className="h-4 w-4 flex-shrink-0" />
                <p>Links</p>
              </div>
              <div>
                {!disableUserActions && (
                  <button
                    type="button"
                    className={`flex ${
                      disableUserActions ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-90"
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
                  userAuth={{
                    isGuest: currentProjectRole === EUserWorkspaceRoles.GUEST,
                    isViewer: currentProjectRole === EUserWorkspaceRoles.VIEWER,
                    isMember: currentProjectRole === EUserWorkspaceRoles.MEMBER,
                    isOwner: currentProjectRole === EUserWorkspaceRoles.ADMIN,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
