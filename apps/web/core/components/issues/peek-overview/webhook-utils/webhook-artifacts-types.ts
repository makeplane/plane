export type TWebhookArtifactMediaType = "video" | "image" | "document";

export type TWebhookArtifact = {
  id: string;
  title: string;
  format: string;
  action: string;
  path: string;
  openUrl: string;
  mediaType: TWebhookArtifactMediaType;
};

export type PeekOverviewWebhookArtifactsProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  onVideoModalOpenChange?: (isOpen: boolean) => void;
};

export type TVideoSourceCandidate = {
  src: string;
  type?: string;
  withCredentials: boolean;
  crossOrigin: "anonymous" | "use-credentials";
};
