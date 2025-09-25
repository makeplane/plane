// ----------------------------------------
// Core Entities
// ----------------------------------------

/**
 * Represents a comment on a Git platform
 */
export interface IGitComment {
  id: string | number;
  body: string;
  created_at: string;
  updated_at?: string;
  user: {
    id: string | number;
    login?: string;
    username?: string;
    name?: string;
  };
}

/**
 * Common properties of a pull request
 */
export interface IPullRequestDetails {
  pull_request_id?: number;
  title: string;
  description: string;
  number: number;
  url: string;
  repository: {
    owner: string;
    name: string;
    id: string | number;
  };
  state: "open" | "closed";
  merged: boolean;
  draft: boolean;
  mergeable: boolean | null;
  mergeable_state: string | null;
}
