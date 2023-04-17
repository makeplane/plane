// All the app integrations that are available
export interface IAppIntegration {
  author: string;
  author: "";
  avatar_url: string | null;
  created_at: string;
  created_by: string | null;
  description: any;
  id: string;
  metadata: any;
  network: number;
  provider: string;
  redirect_url: string;
  title: string;
  updated_at: string;
  updated_by: string | null;
  verified: boolean;
  webhook_secret: string;
  webhook_url: string;
}

export interface IWorkspaceIntegration {
  actor: string;
  api_token: string;
  config: any;
  created_at: string;
  created_by: string;
  id: string;
  integration: string;
  integration_detail: IIntegrations;
  metadata: any;
  updated_at: string;
  updated_by: string;
  workspace: string;
}
