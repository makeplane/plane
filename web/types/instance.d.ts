import { IUserLite } from "./users";

export interface IInstance {
  id: string;
  primary_owner_details: IUserLite;
  created_at: string;
  updated_at: string;
  instance_name: string;
  whitelist_emails: string | null;
  instance_id: string;
  license_key: string | null;
  api_key: string;
  version: string;
  primary_email: string;
  last_checked_at: string;
  namespace: string | null;
  is_telemetry_enabled: boolean;
  is_support_required: boolean;
  created_by: string | null;
  updated_by: string | null;
  primary_owner: string;
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

export interface IFormattedInstanceConfiguration{
  [key: string]: string;
}
