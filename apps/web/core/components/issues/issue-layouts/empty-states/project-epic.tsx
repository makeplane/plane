import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectEpicsEmptyState: React.FC = observer(() => {
  // router
  const { projectId } = useParams();
  // states
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectEpicId } = useIssueTypes();
  // derived values
  const projectEpicId = getProjectEpicId(projectId?.toString());
  const epicsResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/epics/epics",
  });
  const hasProjectMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

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
      <DetailedEmptyState
        title={t("epics.empty_state.general.title")}
        description={t("epics.empty_state.general.description")}
        assetPath={epicsResolvedPath}
        primaryButton={{
          text: t("epics.empty_state.general.primary_button.text"),
          onClick: () => setIsCreateIssueModalOpen(true),
          disabled: !hasProjectMemberLevelPermissions,
        }}
      />
    </div>
  );
});
