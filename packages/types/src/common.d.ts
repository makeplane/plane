export type TPaginationInfo = {
  count: number;
  extra_stats: string | null;
  next_cursor: string;
  next_page_results: boolean;
  prev_cursor: string;
  prev_page_results: boolean;
  total_pages: number;
  per_page?: number;
  total_results: number;
};

export type TLogoProps = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
    background_color?: string;
  };
};

export type TNameDescriptionLoader = "submitting" | "submitted" | "saved";

export type TFetchStatus = "partial" | "complete" | undefined;

export type ICustomSearchSelectOption = {
  value: any;
  query: string;
  content: React.ReactNode;
  disabled?: boolean;
  tooltip?: string | React.ReactNode;
};
