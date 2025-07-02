import { FC } from "react";
// plane types
import { observer } from "mobx-react";
import { TWorkItemAdditionalWidgetModalsProps } from "@/ce/components/issues/issue-detail-widgets/modals";
import { useIssueDetail } from "@/hooks/store";
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
