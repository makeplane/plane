import type { TProjectBaseActivity } from "@plane/types";

export type TProjectActivity = TProjectBaseActivity & {
  content: string;
  userId: string;
  projectId: string;

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

  createdAt: string;
  updatedAt: string;
};
