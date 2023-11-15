export interface IApiToken {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  description: string;
  is_active: boolean;
  last_used?: string;
  token: string;
  user_type: number;
  expired_at?: string;
  created_by: string;
  updated_by: string;
  user: string;
  workspace: string;
}
