import { observer } from "mobx-react";
// components
import { CycleCreateUpdateModal } from "@/components/cycles";
import { CreateUpdateModuleModal } from "@/components/modules";
import { CreatePageModal } from "@/components/pages";
import { CreateUpdateProjectViewModal } from "@/components/views";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web hooks
import { EPageStoreType } from "@/plane-web/hooks/store";

export type TProjectLevelModalsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectLevelModals = observer((props: TProjectLevelModalsProps) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const {
    isCreateCycleModalOpen,
    toggleCreateCycleModal,
    isCreateModuleModalOpen,
    toggleCreateModuleModal,
    isCreateViewModalOpen,
    toggleCreateViewModal,
    createPageModal,
    toggleCreatePageModal,
  } = useCommandPalette();

  return (
    <>
      <CycleCreateUpdateModal
        isOpen={isCreateCycleModalOpen}
        handleClose={() => toggleCreateCycleModal(false)}
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
      />
      <CreateUpdateModuleModal
        isOpen={isCreateModuleModalOpen}
        onClose={() => toggleCreateModuleModal(false)}
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
      />
      <CreateUpdateProjectViewModal
        isOpen={isCreateViewModalOpen}
        onClose={() => toggleCreateViewModal(false)}
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
      />
      <CreatePageModal
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        isModalOpen={createPageModal.isOpen}
        pageAccess={createPageModal.pageAccess}
        handleModalClose={() => toggleCreatePageModal({ isOpen: false })}
        redirectionEnabled
        storeType={EPageStoreType.PROJECT}
      />
    </>
  );
});
