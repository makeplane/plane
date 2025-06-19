export interface ChangelogItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  description: any;
  published: boolean;
}

export interface ChangelogPaginationData {
  docs: ChangelogItem[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: number | null;
  page: number;
  pagingCounter: number;
  prevPage: number | null;
  totalDocs: number;
  totalPages: number;
}
