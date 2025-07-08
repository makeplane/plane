export enum EPageSharedUserAccess {
  VIEW = 0,
  COMMENT = 1,
  EDIT = 2,
}

export type TCollaborator = {
  name: string;
  color: string;
  id?: string;
  photoUrl?: string;
  clientId?: number;
};

export type TPageSharedUser = {
  user_id: string;
  access: EPageSharedUserAccess;
};

export type TPageExtended = {
  shared_access: EPageSharedUserAccess | null;
  is_shared: boolean;
  collaborators: TCollaborator[];
  sub_pages_count: number | undefined;
  team: string | null | undefined;
  parent_id: string | null | undefined;
  anchor?: string | null | undefined;
  sharedUsers: TPageSharedUser[]; // Users the page is shared with
};
