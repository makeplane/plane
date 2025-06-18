export interface IInstanceChangeLog {
  version: string;
  release_date: string;
  tags: string[];
  title: string;
  description: string;
  is_release_candidate: boolean;
}
