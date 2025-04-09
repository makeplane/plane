import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType, ETemplateType } from "@plane/constants";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
import { CreateProjectModal } from "@/components/project";

type TChildProps = {
  handleUseTemplateAction: (templateId: string, type: ETemplateType) => void;
};

type TTemplateListActionWrapperProps = {
  workspaceSlug: string;
  children: (props: TChildProps) => React.ReactElement;
};

export const TemplateListActionWrapper = observer((props: TTemplateListActionWrapperProps) => {
  const { workspaceSlug, children } = props;
  // states
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateWorkItemModalOpen, setIsCreateWorkItemModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleUseTemplateAction = (templateId: string, type: ETemplateType) => {
    setSelectedTemplateId(templateId);
    switch (type) {
      case ETemplateType.PROJECT:
        setIsCreateProjectModalOpen(true);
        break;
      case ETemplateType.WORK_ITEM:
        setIsCreateWorkItemModalOpen(true);
        break;
    }
  };

  const handleModalClose = () => {
    setSelectedTemplateId(null);
  };

  return (
    <>
      <CreateProjectModal
        workspaceSlug={workspaceSlug}
        templateId={selectedTemplateId ?? undefined}
        isOpen={isCreateProjectModalOpen}
        onClose={() => {
          setIsCreateProjectModalOpen(false);
          handleModalClose();
        }}
      />
      <CreateUpdateIssueModal
        isOpen={isCreateWorkItemModalOpen}
        onClose={() => {
          setIsCreateWorkItemModalOpen(false);
          handleModalClose();
        }}
        storeType={EIssuesStoreType.PROJECT}
        templateId={selectedTemplateId ?? undefined}
      />
      <div className="flex flex-col gap-10 py-6">{children({ handleUseTemplateAction })}</div>
    </>
  );
});
