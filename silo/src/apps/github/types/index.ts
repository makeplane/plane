import { z } from "zod";
import { TWorkspaceConnection, TWorkspaceCredential, TWorkspaceEntityConnection } from "@plane/types";
import { MergeRequestEvent } from "../helpers/helpers";

const webhooksUserSchema = z.object({
  avatar_url: z.string().url().optional(),
  deleted: z.boolean().optional(),
  email: z.string().email().nullable().optional(),
  events_url: z.string().optional(),
  followers_url: z.string().url().optional(),
  following_url: z.string().optional(),
  gists_url: z.string().optional(),
  gravatar_id: z.string().optional(),
  html_url: z.string().url().optional(),
  id: z.number(),
  login: z.string(),
  name: z.string().optional().nullable(),
  node_id: z.string().optional(),
  organizations_url: z.string().url().optional(),
  received_events_url: z.string().url().optional(),
  repos_url: z.string().url().optional(),
  site_admin: z.boolean().optional(),
  starred_url: z.string().optional(),
  subscriptions_url: z.string().url().optional(),
  type: z.enum(["Bot", "User", "Organization"]).optional(),
  url: z.string().url().optional(),
});

export const userMapSchema = z.array(
  z.object({
    planeUser: z.object({
      id: z.string(),
      email: z.string().email().nullable(),
      name: z.string().optional().nullable(),
      avatarUrl: z.string().url().optional(),
    }),
    githubUser: webhooksUserSchema,
  })
);

export const githubWorkspaceConnectionSchema = z.object({
  // Mapping of the users
  userMap: userMapSchema,
});

export type GithubUserMap = z.infer<typeof userMapSchema>;

export type GithubWorkspaceConnection = TWorkspaceConnection<z.infer<typeof githubWorkspaceConnectionSchema>>;
let x: GithubWorkspaceConnection;

const exStateSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const githubEntityConnectionSchema = z.object({
  states: z.object({
    mergeRequestEventMapping: z.record(z.custom<MergeRequestEvent>(), exStateSchema),
  }),
});

export type GithubEntityConnection = TWorkspaceEntityConnection<z.infer<typeof githubEntityConnectionSchema>>;

export type GithubConnectionDetails = {
  workspaceConnection: GithubWorkspaceConnection;
  entityConnection: GithubEntityConnection;
};

export type PlaneConnectionDetails = {
  credentials: TWorkspaceCredential;
  entityConnection: GithubEntityConnection;
  workspaceConnection: GithubWorkspaceConnection;
};

export type PullRequestWebhookActions =
  | "assigned"
  | "auto_merge_enabled"
  | "auto_merge_disabled"
  | "closed"
  | "edited"
  | "labeled"
  | "locked"
  | "opened"
  | "ready_for_review"
  | "reopened"
  | "review_request_removed"
  | "review_requested"
  | "synchronize"
  | "unassigned"
  | "unlabeled"
  | "unlocked";

export enum E_GITHUB_DISCONNECT_SOURCE {
  ROUTE_DISCONNECT = "route-disconnect",
  WEBHOOK_DISCONNECT = "webhook-disconnect",
}
