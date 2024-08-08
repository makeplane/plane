// editor
import { TEmbedConfig } from "@plane/editor";
// types
import { TPageEmbedType } from "@plane/types";
// plane web components
import { IssueEmbedUpgradeCard } from "@/plane-web/components/pages";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useIssueEmbed = (workspaceSlug: string, projectId: string, queryType: TPageEmbedType = "issue") => {
  const widgetCallback = () => <IssueEmbedUpgradeCard />;

  const issueEmbedProps: TEmbedConfig["issue"] = {
    widgetCallback,
  };

  return {
    issueEmbedProps,
  };
};
