// Generic paginated response type for API responses
export type TPaginatedResponse<T> = {
  results: T;
  grouped_by?: string | null;
  sub_grouped_by?: string | null;
  total_count?: number;
  next_cursor?: string;
  prev_cursor?: string;
  next_page_results?: boolean;
  prev_page_results?: boolean;
  count?: number;
  total_pages?: number;
  total_results?: number;
  extra_stats?: string | null;
};
