// add the types for the db queries here

export type TApplicationSecret = {
  id: string;
  key: string;
  value: string;
  is_secured: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};