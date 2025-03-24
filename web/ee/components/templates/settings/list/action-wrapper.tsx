import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType, ETemplateType } from "@plane/constants";
// components
import { CreateUpdateIssueModal } from "@/components/issues";

type TChildProps = {
  handleUseTemplateAction: (templateId: string, type: ETemplateType) => void;
};

type TTemplateListActionWrapperProps = {
  children: (props: TChildProps) => React.ReactElement;
};

export const TemplateListActionWrapper = observer((props: TTemplateListActionWrapperProps) => {
  const { children } = props;
  // states
  const [isCreateWorkItemModalOpen, setIsCreateWorkItemModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleUseTemplateAction = (templateId: string, type: ETemplateType) => {
    setSelectedTemplateId(templateId);
    switch (type) {
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
