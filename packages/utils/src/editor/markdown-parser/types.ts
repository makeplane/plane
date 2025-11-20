export type TCoreCustomComponentsMetaData = {
  file_assets: {
    id: string;
    name: string;
    url: string;
  }[];
  user_mentions: {
    id: string;
    display_name: string;
    url: string;
  }[];
};

export type TExtendedCustomComponentsMetaData = unknown;

export type TCustomComponentsMetaData = TCoreCustomComponentsMetaData & TExtendedCustomComponentsMetaData;
