// editor
import { TEmbedConfig } from "@plane/editor";
// plane types
import { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane web components
import { IssueEmbedUpgradeCard } from "@/plane-web/components/pages";

export type TIssueEmbedHookProps = {
  fetchEmbedSuggestions?: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  projectId?: string;
  workspaceSlug?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useIssueEmbed = (props: TIssueEmbedHookProps) => {
  const widgetCallback = () => <IssueEmbedUpgradeCard />;

  const issueEmbedProps: TEmbedConfig["issue"] = {
    widgetCallback,
  };

  return {
    issueEmbedProps,
  };
};
