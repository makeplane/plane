import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export interface ChangelogItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  description: SerializedEditorState;
  published: boolean;
}

export interface ChangelogDoc {
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

export interface TChangeLogConfig {
  slug: string;
  limit: number;
  page: number;
}
