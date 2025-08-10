import {
  E_INTEGRATION_KEYS,
  TGithubWorkspaceConnection,
  TGitlabWorkspaceConnection,
  TSlackWorkspaceConnection,
  TGithubEntityConnection,
  TGitlabEntityConnection,
  TSlackEntityConnection,
} from "@plane/types";

type TWorkspaceConnectionMap = {
  [E_INTEGRATION_KEYS.GITHUB]: TGithubWorkspaceConnection;
  [E_INTEGRATION_KEYS.GITLAB]: TGitlabWorkspaceConnection;
  [E_INTEGRATION_KEYS.SLACK]: TSlackWorkspaceConnection;
};

type TEntityConnectionMap = {
  [E_INTEGRATION_KEYS.GITHUB]: TGithubEntityConnection;
  [E_INTEGRATION_KEYS.GITLAB]: TGitlabEntityConnection;
  [E_INTEGRATION_KEYS.SLACK]: TSlackEntityConnection;
};
