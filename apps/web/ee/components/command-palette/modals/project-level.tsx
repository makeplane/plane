import { observer } from "mobx-react";
// ce components
import {
  ProjectLevelModals as BaseProjectLevelModals,
  TProjectLevelModalsProps,
} from "@/ce/components/command-palette/modals/project-level";
import { CreateUpdateAutomationModal } from "@/plane-web/components/automations/modals/create-update-modal";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

export const ProjectLevelModals = observer((props: TProjectLevelModalsProps) => {
  // store hooks
  const {
    projectAutomations: { createUpdateModalConfig, setCreateUpdateModalConfig },
  } = useAutomations();

  return (
    <>
      <BaseProjectLevelModals {...props} />
      <CreateUpdateAutomationModal
        isOpen={createUpdateModalConfig.isOpen}
        data={createUpdateModalConfig.payload ?? undefined}
        onClose={() => setCreateUpdateModalConfig({ isOpen: false, payload: null })}
      />
    </>
  );
});
