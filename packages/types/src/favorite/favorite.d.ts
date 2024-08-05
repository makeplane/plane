export type IFavorite = {
  id: string;
  name: string;
  entity_type: string;
  entity_data: {
    name: string;
  };
  is_folder: boolean;
  sort_order: number;
  parent: string | null;
  entity_identifier?: string | null;
  children: IFavorite[];
  project_id: string | null;
  sequence: number;
};
