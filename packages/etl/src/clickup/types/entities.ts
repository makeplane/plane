import { TClickUpSpaceFeatures } from "./space-features";

// clickup hierarchy TEAM -> SPACE -> FOLDER -> LIST -> TASK

// User/Creator type
export type TClickUpUser = {
  id: number;
  username: string;
  color: string;
  email: string;
  profilePicture: string | null;
  initials?: string;
  role: number;
  role_key: "admin" | "owner" | "member";
}; // ClickUp Task Types based on real response payload

// User avatar type
export type TClickUpAvatar = {
  attachment_id: string | null;
  color: string | null;
  source: string | null;
  icon: string | null;
};

// Extended user type with avatar
export type TClickUpGroupMember = {
  id: number;
  username: string;
  email: string;
  color: string;
  initials: string;
  profilePicture: string | null;
  avatar: TClickUpAvatar;
};

// Group type for group_assignees
export type TClickUpGroup = {
  id: string;
  team_id: string;
  userid: number;
  name: string;
  handle: string;
  date_created: string;
  initials: string;
  members: TClickUpGroupMember[];
};

// Status type
export type TClickUpStatus = {
  id: string;
  status: string;
  color: string;
  orderindex: number;
  type: string;
};

// Checklist item type
export type TClickUpChecklistItem = {
  id: string;
  name: string;
  orderindex: number;
  assignee: TClickUpUser | null;
  group_assignee: TClickUpGroup | null;
  resolved: boolean;
  parent: string | null;
  date_created: string;
  start_date: string | null;
  start_date_time: boolean;
  due_date: string | null;
  due_date_time: boolean;
  sent_due_date_notif: string | null;
  children: TClickUpChecklistItem[];
};

// Checklist type
export type TClickUpChecklist = {
  id: string;
  task_id: string;
  name: string;
  date_created: string;
  orderindex: number;
  creator: number;
  resolved: number;
  unresolved: number;
  items: TClickUpChecklistItem[];
};

// Linked task type
export type TClickUpLinkedTask = {
  task_id: string;
  link_id: string;
  date_created: string;
  userid: string;
  workspace_id: string;
};

// Dependency type
export type TClickUpDependency = {
  task_id: string;
  depends_on: string;
  type: number;
  date_created: string;
  userid: string;
  workspace_id: string;
  chain_id: string | null;
};

// Sharing settings type
export type TClickUpSharing = {
  public: boolean;
  public_share_expires_on: string | null;
  public_fields: string[];
  token: string | null;
  seo_optimized: boolean;
};

// Custom field type and its variants
export type TClickUpCustomFieldKeys =
  | "users"
  | "short_text"
  | "text"
  | "date"
  | "checkbox"
  | "drop_down"
  | "labels"
  | "number"
  | "money"
  | "rating"
  | "people"
  | "email"
  | "phone"
  | "website"
  | "location"
  | "files"
  | "signature"
  | "progress_auto"
  | "progress_manual"
  | "formula"
  | "relationship"
  | "rollup"
  | "tasks";

export type TClickUpCustomFieldOption = {
  id: string;
  name?: string;
  label?: string;
  color: string;
  orderindex: number;
};

export type TClickUpCustomField = {
  id: string;
  name: string;
  type: TClickUpCustomFieldKeys;
  type_config: { options: TClickUpCustomFieldOption[] };
  date_created: string;
  hide_from_guests: boolean;
  required: boolean;
  value?: string | number | TClickUpUser[] | string[]; // Optional since it might not always be present
};

// Attachment type
export type TClickUpAttachment = {
  id: string;
  date: string;
  title: string;
  type: number;
  source: number;
  version: number;
  extension: string;
  thumbnail_small: string;
  thumbnail_medium: string;
  thumbnail_large: string;
  is_folder: boolean | null;
  mimetype: string;
  hidden: boolean;
  parent_id: string;
  size: number;
  total_comments: number;
  resolved_comments: number;
  user: TClickUpUser;
  deleted: boolean;
  orientation: string | null;
  url: string;
  email_data: Record<string, unknown> | null;
  workspace_id: string | null;
  url_w_query: string;
  url_w_host: string;
};

export type TClickUpTag = {
  name: string;
  tag_fg: string;
  tag_bg: string;
  creator: number;
};

export type TClickUpLocation = {
  id: string;
  name: string;
  access: boolean;
};

export type TClickUpPriority = {
  color: string;
  id: string;
  orderindex: string;
  priority: string;
};

export type TClickUpCustomTaskType = {
  id: number;
  name: string;
  name_plural: string | null;
  description: string | null;
  avatar?: {
    source: string | null;
    value: string | null;
  };
};

export type TClickUpComment = {
  id: string;
  comment: { text: string; type: string; image: { url: string } }[];
  comment_text: string;
  user: TClickUpUser;
  resolved: boolean;
  assignee: TClickUpUser | null;
  assigned_by: TClickUpUser | null;
  reactions: string[];
  date: string;
  reply_count: string;
};

// Main task interface
export type TClickUpTask = {
  id: string;
  custom_id: string | null;
  custom_item_id: number | null;
  name: string;
  text_content: string;
  description: string | null;
  markdown_description: string | null;
  status: TClickUpStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: string | null;
  date_done: string | null;
  archived: boolean;
  creator: TClickUpUser;
  assignees: TClickUpUser[];
  group_assignees: TClickUpGroup[];
  watchers: TClickUpUser[];
  checklists: TClickUpChecklist[];
  tags: TClickUpTag[];
  parent: string | null;
  top_level_parent: string | null;
  priority: TClickUpPriority | null;
  due_date: string | null;
  start_date: string | null;
  points: number | null;
  time_estimate: number | null;
  time_spent: number | null;
  custom_fields: TClickUpCustomField[];
  dependencies: TClickUpDependency[];
  linked_tasks: TClickUpLinkedTask[];
  locations: TClickUpLocation[];
  team_id: string;
  url: string;
  sharing: TClickUpSharing;
  permission_level: string;
  list: TClickUpList;
  folder: TClickUpFolder;
  space: TClickUpSpace;
  attachments: TClickUpAttachment[];
};

export type TClickUpTeam = {
  id: string;
  name: string;
  color: string;
  avatar: string | null;
  members: { user: TClickUpUser }[];
};

// Main space type
export type TClickUpSpace = {
  id: string;
  name: string;
  color: string;
  private: boolean;
  avatar: string | null;
  admin_can_manage: boolean;
  statuses: TClickUpStatus[];
  multiple_assignees: boolean;
  features: TClickUpSpaceFeatures;
  archived: boolean;
};

// Main folder type
export type TClickUpFolder = {
  id: string;
  name: string;
  orderindex: number;
  override_statuses: boolean;
  hidden: boolean;
  space: TClickUpSpace;
  task_count: string;
  archived: boolean;
  statuses: TClickUpStatus[];
  lists: TClickUpList[];
  permission_level: string;
};

export type TClickUpList = {
  id: string;
  name: string;
  orderindex: number;
  status: string | null;
  priority: string | null;
  assignee: TClickUpUser | null;
  task_count: number;
  due_date: string | null;
  start_date: string | null;
  space: TClickUpSpace;
  folder: TClickUpFolder;
  archived: boolean;
  override_statuses: boolean;
  statuses: TClickUpStatus[];
  permission_level: string;
};
