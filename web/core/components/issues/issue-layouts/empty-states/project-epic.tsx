import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { CreateUpdateEpicModal } from "@/plane-web/components/epics";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectEpicsEmptyState: React.FC = observer(() => {
  // router
  const { projectId } = useParams();
  // states
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
  // store hooks
  const { getProjectEpicId } = useIssueTypes();
  // derived values
  const projectEpicId = getProjectEpicId(projectId?.toString());

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <CreateUpdateEpicModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        data={{
          project_id: projectId.toString(),
          type_id: projectEpicId,
        }}
      />
      <EmptyState type={EmptyStateType.PROJECT_NO_EPICS} primaryButtonOnClick={() => setIsCreateIssueModalOpen(true)} />
    </div>
  );
});
