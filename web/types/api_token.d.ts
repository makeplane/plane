export interface IApiToken {
  created_at: string;
  created_by: string;
  description: string;
  expired_at: string | null;
  id: string;
  is_active: boolean;
  label: string;
  last_used: string | null;
  updated_at: string;
  updated_by: string;
  user: string;
  user_type: number;
  token?: string;
  workspace: string;
}
