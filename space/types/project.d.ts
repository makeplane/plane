import { TLogoProps } from "@plane/types";

export type TWorkspaceDetails = {
  name: string;
  slug: string;
  id: string;
};

export type TViewDetails = {
  list: boolean;
  gantt: boolean;
  kanban: boolean;
  calendar: boolean;
  spreadsheet: boolean;
};

export type TProjectDetails = {
  id: string;
  identifier: string;
  name: string;
  cover_image: string | undefined;
  logo_props: TLogoProps;
  description: string;
};
