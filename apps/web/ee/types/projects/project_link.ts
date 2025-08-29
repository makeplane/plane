export type TProjectLinkEditableFields = {
  title: string;
  url: string;
};

export type TProjectLink = TProjectLinkEditableFields & {
  created_by_id: string;
  id: string;
  metadata: any;
  project_id: string;

  //need
  created_at: Date;
};

export type TProjectLinkMap = {
  [project_id: string]: TProjectLink;
};

export type TProjectLinkIdMap = {
  [project_id: string]: string[];
};
