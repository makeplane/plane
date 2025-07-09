export type TDescriptionVersion = {
  created_at: string;
  created_by: string | null;
  id: string;
  last_saved_at: string;
  owned_by: string;
  project: string;
  updated_at: string;
  updated_by: string | null;
};

export type TDescriptionVersionDetails = TDescriptionVersion & {
  description_binary: string | null;
  description_html: string | null;
  description_json: object | null;
  description_stripped: string | null;
};

export type TDescriptionVersionsListResponse = {
  cursor: string;
  next_cursor: string | null;
  next_page_results: boolean;
  page_count: number;
  prev_cursor: string | null;
  prev_page_results: boolean;
  results: TDescriptionVersion[];
  total_pages: number;
  total_results: number;
};
