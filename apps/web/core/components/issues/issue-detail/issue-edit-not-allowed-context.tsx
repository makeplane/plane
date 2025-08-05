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

  // 更新值的方法
  const toggleIssueEditAllowed = () => {
    setIssueEditNotAllowed(!isIssueEditNotAllowed);
  };

  // 提供value和updateValue给子组件
  return (
    <IssueEditNotAllowedContext.Provider value={{ isIssueEditNotAllowed, toggleIssueEditAllowed }}>
      {children}
    </IssueEditNotAllowedContext.Provider>
  );
}

export function useIssueEditNotAllowedContext() {
  return useContext(IssueEditNotAllowedContext);
}
