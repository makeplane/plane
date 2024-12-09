const workspaceScopes: string[] = [
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
];

export const getWorkspaceAuthScopes = () => workspaceScopes.join(",");

const userScopes: string[] = ["chat:write", "links:write", "identify", "im:read", "im:write"];

export const getUserAuthScopes = () => userScopes.join(",");
