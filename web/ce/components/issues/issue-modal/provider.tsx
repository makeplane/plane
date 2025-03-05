import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// plane imports
import { ISearchIssueResponse } from "@plane/types";
// components
import { IssueModalContext } from "@/components/issues";

export type TIssueModalProviderProps = {
  templateId?: string;
  children: React.ReactNode;
};

export const IssueModalProvider = observer((props: TIssueModalProviderProps) => {
  const { children } = props;
  // states
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);

  return (
    <IssueModalContext.Provider
      value={{
        workItemTemplateId: null,
        setWorkItemTemplateId: () => {},
        isApplyingTemplate: false,
        setIsApplyingTemplate: () => {},
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues: {},
        setIssuePropertyValues: () => {},
        issuePropertyValueErrors: {},
        setIssuePropertyValueErrors: () => {},
        getIssueTypeIdOnProjectChange: () => null,
        getActiveAdditionalPropertiesLength: () => 0,
        handlePropertyValuesValidation: () => true,
        handleCreateUpdatePropertyValues: () => Promise.resolve(),
        handleParentWorkItemDetails: () => Promise.resolve(undefined),
        handleProjectEntitiesFetch: () => Promise.resolve(),
        handleTemplateChange: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
