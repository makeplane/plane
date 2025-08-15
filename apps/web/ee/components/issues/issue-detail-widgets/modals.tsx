import { FC } from "react";
// plane imports
import { observer } from "mobx-react";
// ce imports
import type { TWorkItemAdditionalWidgetModalsProps } from "@/ce/components/issues/issue-detail-widgets/modals";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { PagesMultiSelectModal } from "./pages/multi-select-modal";

export const WorkItemAdditionalWidgetModals: FC<TWorkItemAdditionalWidgetModalsProps> = observer((props) => {
  const { issueServiceType, workItemId, workspaceSlug } = props;
  const {
    issue: { getIssueById },
    togglePagesModal,
    isPagesModalOpen,
  } = useIssueDetail(issueServiceType);
  const issue = getIssueById(workItemId);

  return (
    <>
      <PagesMultiSelectModal
        issueServiceType={issueServiceType}
        workspaceSlug={workspaceSlug}
        projectId={issue?.project_id}
        workItemId={workItemId}
        isOpen={isPagesModalOpen === workItemId}
        onClose={() => {
          togglePagesModal(null);
        }}
        selectedPages={[]}
      />
    </>
  );
});
