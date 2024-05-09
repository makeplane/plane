import { TProjectLogoProps } from "@plane/types";

export interface IWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface IProject {
  id: string;
  identifier: string;
  name: string;
  description: string;
  cover_image: string | null;
  logo_props: TProjectLogoProps;
}

export interface IProjectSettings {
  comments: boolean;
  reactions: boolean;
  votes: boolean;
  views: {
    list: boolean;
    gantt: boolean;
    kanban: boolean;
    calendar: boolean;
    spreadsheet: boolean;
  };
}
