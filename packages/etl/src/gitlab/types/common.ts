// GitlabIssue type
export interface GitlabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: "opened" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: string[];
  milestone: GitlabMilestone | null;
  assignees: GitlabUser[];
  author: GitlabUser;
  confidential: boolean;
  due_date: string | null;
  web_url: string;
}

// GitlabLabel type
export interface GitlabLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
  text_color: string;
}

// GitlabMilestone type
export interface GitlabMilestone {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: "active" | "closed";
  created_at: string;
  updated_at: string;
  due_date: string | null;
  start_date: string | null;
  web_url: string;
}

// GitlabUser type
export interface GitlabUser {
  id: number;
  username: string;
  name: string;
  state: "active" | "blocked";
  avatar_url: string;
  web_url: string;
}

// Additional types that might be useful

// GitlabProject type
export interface GitlabProject {
  id: number;
  name: string;
  description: string;
  web_url: string;
  avatar_url: string | null;
  git_ssh_url: string;
  git_http_url: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
  };
  path_with_namespace: string;
  default_branch: string;
  visibility: "private" | "internal" | "public";
}

// GitlabMergeRequest type
export interface GitlabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: "opened" | "closed" | "locked" | "merged";
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  target_branch: string;
  source_branch: string;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  author: GitlabUser;
  assignees: GitlabUser[];
  reviewers: GitlabUser[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  work_in_progress: boolean;
  milestone: GitlabMilestone | null;
  merge_when_pipeline_succeeds: boolean;
  merge_status: "can_be_merged" | "cannot_be_merged";
  sha: string;
  merge_commit_sha: string | null;
  squash_commit_sha: string | null;
  discussion_locked: boolean;
  should_remove_source_branch: boolean;
  force_remove_source_branch: boolean;
  reference: string;
  web_url: string;
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
  };
  squash: boolean;
  task_completion_status: {
    count: number;
    completed_count: number;
  };
}

export interface GitlabNote {
  id: number;
  body: string;
  attachment: string | null;
  author: {
    id: number;
    username: string;
    email: string;
    name: string;
    state: string;
    created_at: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: "Issue" | "MergeRequest" | "Snippet" | "Epic";
  project_id: number;
  noteable_iid: number;
  resolvable: boolean;
  confidential: boolean;
  internal: boolean;
  imported?: boolean;
  imported_from?: string;
}

export interface GitlabWebhook {
  url: string;
  token: string;
}

export interface GitlabEntityData {
  id: string;
  type: string;
  webhookId: string;
}

export enum GitlabEntityType {
  PROJECT = "PROJECT",
  GROUP = "GROUP",
}

export interface IGitlabEntity {
  id: string;
  name: string;
  path: string;
  path_with_namespace: string;
  type: GitlabEntityType;
}


export enum EConnectionType {
  ENTITY = "ENTITY",
  PLANE_PROJECT = "PLANE_PROJECT",
}