export interface IModuleActivity {
  id: string;
  module: string;
  actor: string | null;
  actor_detail: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar: string;
    avatar_url: string;
  } | null;
  verb: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  epoch: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  project: string;
  workspace: string;
}
