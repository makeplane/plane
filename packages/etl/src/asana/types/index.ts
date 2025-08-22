// plane sdk
import { ExProject, ExState } from "@plane/sdk";

// Auth States for Asana
export type AsanaAuthState = {
  workspaceId: string;
  workspaceSlug: string;
  apiToken: string;
  userId: string;
};

export type AsanaPATAuthState = {
  workspaceId: string;
  userId: string;

  apiToken: string;
  personalAccessToken: string;
};

// Payload for Asana OAuth
export type AsanaAuthPayload = {
  state: string;
  code: string;
};

// Props required for Asana OAuth
export type AsanaAuthProps = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
};

export type StateConfig = {
  source_state: {
    id: string;
    name: string;
  };
  target_state: ExState;
};

export type PriorityConfig = {
  source_priority: {
    id: string;
    name: string;
  };
  target_priority: string;
};

export type PriorityConfigSettings = {
  custom_field_id?: string | undefined;
  priority_config?: PriorityConfig[] | undefined;
};

export type AsanaConfig = {
  planeProject: ExProject;
  workspace: AsanaWorkspace;
  project: AsanaProject;
  state: StateConfig[];
  priority?: PriorityConfigSettings | undefined;
  skipUserImport: boolean | false;
};

export type TokenRefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AsanaServiceProps = {
  accessToken: string;
  refreshToken: string | null;
  refreshTokenFunc?: (refreshToken: string) => Promise<TokenRefreshResponse>;
  refreshTokenCallback?: (response: TokenRefreshResponse) => Promise<void>;
  refreshTokenRejectCallback?: () => Promise<void>;
};

export type PaginationPayload = {
  limit: number;
  offset: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  _response: {
    next_page?: {
      offset: string;
      path: string;
      uri: string;
    };
  };
};

// ASANA TYPES
type AsanaResourceType =
  | "user"
  | "workspace"
  | "portfolio"
  | "project"
  | "section"
  | "tag"
  | "task"
  | "custom_field_setting"
  | "custom_field"
  | "enum_option"
  | "attachment";

// Every object in Asana is a resource with a gid and a resource type
interface AsanaResource<T extends AsanaResourceType> {
  gid: string;
  resource_type: T;
}

export type AsanaWorkspace = AsanaResource<"workspace"> & {
  name: string;
};

export type AsanaProject = AsanaResource<"project"> & {
  name: string;
};

export type AsanaSection = AsanaResource<"section"> & {
  name: string;
};

export type AsanaUser = AsanaResource<"user"> & {
  name: string;
  email: string;
};

export type AsanaTaskMembership = {
  project: AsanaProject;
  section: AsanaSection;
};

export type AsanaTag = AsanaResource<"tag"> & {
  name: string;
  color: string;
};

export type AsanaCustomFieldType = "text" | "number" | "enum" | "multi_enum" | "date" | "people";

export type AsanaEnumOption = AsanaResource<"enum_option"> & {
  name: string;
  color: string;
  enabled: boolean;
};

export type AsanaDateFieldValue = {
  date: string | null;
  date_time: string | null;
};

export type AsanaCustomField = AsanaResource<"custom_field"> & {
  enabled?: boolean;
  name: string;
  display_value?: string; // This is different from our custom property display value, this is used to display the VALUE in Asana. Always a string.
  description?: string | null;
  created_by: AsanaResource<"user">;
  is_formula_field?: boolean;
  is_value_read_only?: boolean;
  type: AsanaCustomFieldType;
  text_value?: string | null;
  number_value?: number | null;
  precision?: number;
  enum_options?: AsanaEnumOption[];
  enum_value?: AsanaEnumOption | null;
  multi_enum_values?: AsanaEnumOption[];
  date_value?: AsanaDateFieldValue | null;
  people_value?: AsanaResource<"user">[];
};

export type AsanaCustomFieldSettings = AsanaResource<"custom_field_setting"> & {
  custom_field?: AsanaCustomField;
  project: AsanaProject;
  parent: AsanaResource<"portfolio" | "project"> | null;
};

export type AsanaAttachment = AsanaResource<"attachment"> & {
  name: string;
  size: number;
  download_url: string;
};

export type AsanaTask = AsanaResource<"task"> & {
  name: string;
  html_notes: string;
  assignee: AsanaResource<"user"> | null;
  start_on: string | null;
  due_on: string | null;
  permalink_url: string;
  tags: AsanaResource<"tag">[];
  memberships: AsanaTaskMembership[];
  created_at: string;
  created_by: AsanaResource<"user">;
  parent: AsanaResource<"task"> | null;
  num_subtasks: number;
  custom_fields: AsanaCustomField[];
};

export type AsanaEntity = {
  users: AsanaUser[];
  tasks: AsanaTask[];
  tags: AsanaTag[];
  fields: AsanaCustomFieldSettings[];
  attachments: Record<string, AsanaAttachment[]>; // task gid to attachments
  comments: AsanaTaskComment[];
};

export type AsanaProjectTaskCount = {
  num_tasks: number;
};

export type AsanaTaskWithChildren = AsanaTask & {
  children?: AsanaTaskWithChildren[];
};

export type AsanaTaskComment = {
  gid: string;
  text: string;
  created_at: string;
  created_by: AsanaResource<"user">;
  html_text: string;
  type: string;
  task_gid: string;
};
