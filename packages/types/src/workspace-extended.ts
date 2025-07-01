export interface IWorkspaceEpicSearchResult {
  id: string;
  name: string;
  project__identifier: string;
  project_id: string;
  sequence_id: number;
  workspace__slug: string;
  type_id: string;
}

export interface IWorkspaceTeamspaceSearchResult {
  id: string;
  name: string;
  workspace__slug: string;
}

export interface IWorkspaceInitiativeSearchResult {
  id: string;
  name: string;
  workspace__slug: string;
}

export type TWorkspaceExtendedResultEntities = {
  epic: IWorkspaceEpicSearchResult[];
  team: IWorkspaceTeamspaceSearchResult[];
  initiative: IWorkspaceInitiativeSearchResult[];
};
