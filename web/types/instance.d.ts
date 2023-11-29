import { IUserLite } from "./users";

export interface IInstance {
  id: string;
  created_at: string;
  updated_at: string;
  instance_name: string;
  whitelist_emails: string | null;
  instance_id: string;
  license_key: string | null;
  api_key: string;
  version: string;
  last_checked_at: string;
  namespace: string | null;
  is_telemetry_enabled: boolean;
  is_support_required: boolean;
  created_by: string | null;
  updated_by: string | null;
  is_activated: boolean;
  is_setup_done: boolean;
}

export interface IInstanceConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  key: string;
  value: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface IFormattedInstanceConfiguration {
  [key: string]: string;
}

export interface IInstanceAdmin {
  created_at: string;
  created_by: string;
  id: string;
  instance: string;
  role: string;
  updated_at: string;
  updated_by: string;
  user: string;
  user_detail: IUserLite;
}
