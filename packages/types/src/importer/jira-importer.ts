export interface IJiraImporterForm {
  metadata: IJiraMetadata;
  config: IJiraConfig;
  data: IJiraData;
  project_id: string;
}

export interface IJiraConfig {
  epics_to_modules: boolean;
}

export interface IJiraData {
  users: User[];
  invite_users: boolean;
  total_issues: number;
  total_labels: number;
  total_states: number;
  total_modules: number;
}

export interface User {
  username: string;
  import: "invite" | "map" | false;
  email: string;
}

export interface IJiraMetadata {
  cloud_hostname: string;
  api_token: string;
  project_key: string;
  email: string;
}

export interface IJiraResponse {
  issues: number;
  modules: number;
  labels: number;
  states: number;
  users: IJiraResponseUser[];
}

export interface IJiraResponseUser {
  self: string;
  accountId: string;
  accountType: string;
  emailAddress: string;
  avatarUrls: IJiraResponseAvatarUrls;
  displayName: string;
  active: boolean;
  locale: string;
}

export interface IJiraResponseAvatarUrls {
  "48x48": string;
  "24x24": string;
  "16x16": string;
  "32x32": string;
}
