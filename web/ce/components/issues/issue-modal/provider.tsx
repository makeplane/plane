import React from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueModalContext } from "@/components/issues";

type TIssueModalProviderProps = {
  children: React.ReactNode;
};

export const IssueModalProvider = observer((props: TIssueModalProviderProps) => {
  const { children } = props;
  return (
    <IssueModalContext.Provider
      value={{
        issuePropertyValues: {},
        setIssuePropertyValues: () => {},
        issuePropertyValueErrors: {},
        setIssuePropertyValueErrors: () => {},
        getIssueTypeIdOnProjectChange: () => null,
        getActiveAdditionalPropertiesLength: () => 0,
        handlePropertyValuesValidation: () => true,
        handleCreateUpdatePropertyValues: () => Promise.resolve(),
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
