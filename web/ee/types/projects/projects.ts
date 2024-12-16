import { IProject } from "@plane/types";
// plane web types
import { TProjectPriority } from "@/plane-web/types/workspace-project-filters";

export type TProject = IProject & {
  state_id: string | undefined;
  priority: TProjectPriority | undefined;
  start_date: string | undefined;
  target_date: string | undefined;
  description_html: string | undefined;
  is_epic_enabled: boolean;

};

export type TProjectAnalytics = {
  backlog_issues: number;
  completed_issues: number;
  unstarted_issues: number;
  started_issues: number;
  cancelled_issues: number;
  overdue_issues: number;
};
