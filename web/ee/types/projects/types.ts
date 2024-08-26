import { IProject } from "@plane/types";
// plane web types
import { TProjectPriority } from "@/plane-web/types/workspace-project-filters";

export type TProject = IProject & {
  state_id: string | undefined;
  priority: TProjectPriority | undefined;
  start_date: string | undefined;
  target_date: string | undefined;
};
