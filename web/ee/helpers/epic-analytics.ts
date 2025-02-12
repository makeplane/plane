import { useIssueTypes } from "../hooks/store";

export const updateEpicAnalytics = () => {
  const { updateEpicAnalytics: updateAnalytics } = useIssueTypes();

  return { updateAnalytics };
};
