import { useContext } from "react";
import { issueViewContext } from "contexts/issue-view.context";

const useIssueView = () => {
  const issueViewContextData = useContext(issueViewContext);
  return issueViewContextData;
};

export default useIssueView;
