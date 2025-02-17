import { TEpicAnalyticsGroup } from "@plane/types";

export const updateEpicAnalytics = () => {
  const updateAnalytics = (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => {};

  return { updateAnalytics };
};
