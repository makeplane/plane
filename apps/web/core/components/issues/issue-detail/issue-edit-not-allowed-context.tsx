import React, { createContext, useState, useContext } from "react";
const IssueEditNotAllowedContext = createContext<{
  isIssueEditNotAllowed: boolean;
  toggleIssueEditAllowed: () => void;
}>({
  isIssueEditNotAllowed: true,
  toggleIssueEditAllowed: () => {},
});

export default function IssueEditNotAllowedContextProvider({ children }: { children: React.ReactNode }) {
  const [isIssueEditNotAllowed, setIssueEditNotAllowed] = useState(true);

  // toggle allowed status
  const toggleIssueEditAllowed = () => {
    setIssueEditNotAllowed(!isIssueEditNotAllowed);
  };

  // Provider Component
  return (
    <IssueEditNotAllowedContext.Provider value={{ isIssueEditNotAllowed, toggleIssueEditAllowed }}>
      {children}
    </IssueEditNotAllowedContext.Provider>
  );
}

export function useIssueEditNotAllowedContext() {
  return useContext(IssueEditNotAllowedContext);
}
