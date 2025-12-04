import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { Drawer } from "antd";
import { useAppRouter } from "@/hooks/use-app-router";
import { useParams } from "next/navigation";
import { ModuleDetailContent } from "./module-detail-content";
import { useModule } from "@/hooks/store/use-module";

type Props = {
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  isArchived?: boolean;
};

export const ModuleDetailDrawer: React.FC<Props> = observer((props) => {
  const { moduleId, isOpen, onClose, isArchived } = props;
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const { fetchModuleDetails } = useModule();

  const handleFullscreen = () => {
    if (workspaceSlug && projectId && moduleId) {
      router.push(`/${workspaceSlug}/projects/${projectId}/module-detail/${moduleId}`);
    }
  };

  useEffect(() => {
    if (isOpen && workspaceSlug && projectId && moduleId) {
      fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
    }
  }, [isOpen, workspaceSlug, projectId, moduleId, fetchModuleDetails]);

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      open={isOpen}
      width="70vw"
      styles={{
        body: { padding: 0, backgroundColor: "var(--color-background-100)" },
        header: { backgroundColor: "var(--color-background-100)", borderBottom: "1px solid var(--color-border-200)" },
      }}
    >
      <div className="h-full overflow-y-auto px-6 py-4">
        <ModuleDetailContent moduleId={moduleId} isArchived={!!isArchived} isOpen={isOpen} />
      </div>
    </Drawer>
  );
});
