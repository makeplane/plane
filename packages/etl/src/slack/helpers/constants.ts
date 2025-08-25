const workspaceScopes: string[] = [
  "app_mentions:read",
  "channels:read",
  "channels:join",
  "users:read",
  "users:read.email",
  "chat:write",
  "chat:write.customize",
  "channels:history",
  "groups:history",
  "mpim:history",
  "commands",
  "im:history",
  "links:read",
  "links:write",
  "groups:read",
  "im:read",
  "mpim:read",
  "reactions:read",
  "reactions:write",
  "files:read",
  "files:write",
  "im:write",
  "incoming-webhook",
];

export const getWorkspaceAuthScopes = () => workspaceScopes.join(",");

const userScopes: string[] = ["chat:write", "links:write", "im:read", "im:write", "links:read", "mpim:read"];

export const getUserAuthScopes = () => userScopes.join(",");
