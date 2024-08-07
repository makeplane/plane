type TLogoProps = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
  };
};

export type IFavorite = {
  id: string;
  name: string;
  entity_type: string;
  entity_data: {
    name: string;
    logo_props?: TLogoProps | undefined;
  };
  is_folder: boolean;
  sort_order: number;
  parent: string | null;
  entity_identifier?: string | null;
  children: IFavorite[];
  project_id: string | null;
  sequence: number;
};
