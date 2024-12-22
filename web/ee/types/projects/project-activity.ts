export interface TProjectActivity {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  created_at: string;
  field: string;
  verb: string;
  actor_detail: {
    display_name: string;
    id: string;
  };
  workspace_detail: {
    slug: string;
  };
  project_detail: {
    name: string;
  };
  new_value: string;
  old_value: string;
  project: string;
  new_identifier?: string;
}
