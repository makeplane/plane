export interface IGithubServiceImportFormData {
  metadata: {
    owner: string;
    name: string;
    repository_id: number;
    url: string;
  };
  data: {
    users: {
      username: string;
      import: boolean | "invite" | "map";
      email: string;
    }[];
  };
  config: {
    sync: boolean;
  };
  project_id: string;
}

export interface IGithubRepoCollaborator {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
  url: string;
}

export interface IGithubRepoInfo {
  issue_count: number;
  labels: number;
  collaborators: IGithubRepoCollaborator[];
}
