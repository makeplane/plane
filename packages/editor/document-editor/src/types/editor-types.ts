export interface DocumentDetails {
  title: string;
  created_by: string;
  created_on: Date;
  last_updated_by: string;
  last_updated_at: Date;
}
export interface IMarking {
  type: "heading";
  level: number;
  text: string;
  sequence: number;
}
