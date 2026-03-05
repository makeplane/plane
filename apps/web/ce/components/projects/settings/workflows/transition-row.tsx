import { observer } from "mobx-react";
import { Info, Trash2, Users } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Avatar, CustomSearchSelect } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflowStore } from "@/hooks/store/use-workflow";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stateId: string;
  transitionId: string;
  transitionStateId: string;
  approvers: string[];
  onDeleteTransition: (transitionId: string) => void;
};

export const TransitionRow = observer(function TransitionRow(props: Props) {
  const { workspaceSlug, projectId, stateId, transitionId, transitionStateId, approvers, onDeleteTransition } = props;
  const { t } = useTranslation();
  const workflowStore = useWorkflowStore();
  const { getProjectStates } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();

  const states = getProjectStates(projectId);
  const targetState = states?.find((s) => s.id === transitionStateId);
  const memberIds = getProjectMemberIds(projectId, false) ?? [];

  const handleAddReviewer = async (userId: string) => {
    if (!userId || approvers.includes(userId)) return;
    try {
      await workflowStore.addApprovers(workspaceSlug, projectId, transitionId, stateId, [userId]);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  const handleRemoveApprover = async (approverId: string) => {
    try {
      await workflowStore.removeApprover(workspaceSlug, projectId, transitionId, stateId, approverId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error") });
    }
  };

  // Filter out members already added as approvers
  const availableMembers = memberIds.filter((id) => !approvers.includes(id));

  const memberOptions = availableMembers.map((userId) => {
    const user = getUserDetails(userId);
    return {
      value: userId,
      query: user?.display_name ?? userId,
      content: (
        <div className="flex items-center gap-2">
          <Avatar
            name={user?.display_name}
            src={user?.avatar_url ? getFileURL(user.avatar_url) : undefined}
            size="sm"
          />
          <span>{user?.display_name ?? userId.slice(0, 8)}</span>
        </div>
      ),
    };
  });

  return (
    <div className="rounded-md border border-color-subtle bg-surface-1 p-3">
      {/* Top row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-12 text-color-secondary whitespace-nowrap">
            {t("project_settings.workflows.change_state_to")}
          </span>
          <span className="text-12 text-color-secondary">→</span>
          {targetState ? (
            <div className="flex items-center gap-1.5 text-12 font-medium text-color-primary">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: targetState.color }} />
              {targetState.name}
            </div>
          ) : (
            <span className="text-color-tertiary italic text-12">Unknown state</span>
          )}

          {/* Reviewer count */}
          {approvers.length > 0 && (
            <span className="flex items-center gap-1 text-12 text-color-secondary ml-2">
              <Users className="h-3 w-3" />
              {t("project_settings.workflows.n_listed_reviewers", { count: approvers.length })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Add reviewers dropdown */}
          {availableMembers.length > 0 && (
            <CustomSearchSelect
              value=""
              options={memberOptions}
              onChange={(val: string) => void handleAddReviewer(val)}
              customButton={
                <div className="flex items-center gap-1 rounded border border-color-subtle bg-surface-1 hover:bg-layer-2 px-2.5 py-1 text-12 font-medium text-color-primary transition-colors shadow-sm cursor-pointer">
                  {t("project_settings.workflows.add_reviewers")}
                </div>
              }
              placement="bottom-end"
            />
          )}

          {/* Delete transition */}
          <button
            type="button"
            onClick={() => onDeleteTransition(transitionId)}
            className="flex-shrink-0 text-color-tertiary hover:text-color-error transition-colors"
            aria-label="Delete transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dashed separator */}
      <div className="my-3 border-t border-dashed border-color-subtle w-full" />

      {/* Expanded reviewer list */}
      <div>
        <p className="flex items-center gap-1 text-12 text-color-secondary mb-2">
          {t("project_settings.workflows.when_reviewed_by")}
          <Info className="h-3 w-3" />
        </p>
        <div className="flex flex-wrap gap-1.5">
          {approvers.length === 0 ? (
            <div className="flex items-center gap-1.5 rounded-md border border-color-subtle bg-surface-1 px-2.5 py-1 text-12 text-color-primary">
              <Avatar name="All Members" size="sm" />
              <span>{t("project_settings.workflows.blocker_all_members")}</span>
            </div>
          ) : (
            approvers.map((userId) => {
              const user = getUserDetails(userId);
              return (
                <div
                  key={userId}
                  className="flex items-center gap-1.5 rounded-md border border-color-subtle bg-surface-1 px-2 py-1 text-12 text-color-primary"
                >
                  <Avatar
                    name={user?.display_name}
                    src={user?.avatar_url ? getFileURL(user.avatar_url) : undefined}
                    size="sm"
                  />
                  <span>{user?.display_name ?? userId.slice(0, 8)}</span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveApprover(userId)}
                    className="flex-shrink-0 ml-0.5 text-color-tertiary hover:text-color-error transition-colors"
                    aria-label="Remove approver"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
