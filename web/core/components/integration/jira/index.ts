export * from "./root";
export * from "./give-details";
export * from "./jira-project-detail";
export * from "./import-users";
export * from "./confirm-import";

import { IJiraImporterForm } from "@plane/types";

export type TJiraIntegrationSteps =
  | "import-configure"
  | "display-import-data"
  | "select-import-data"
  | "import-users"
  | "import-confirmation";

export interface IJiraIntegrationData {
  state: TJiraIntegrationSteps;
}

export const jiraFormDefaultValues: IJiraImporterForm = {
  metadata: {
    cloud_hostname: "",
    api_token: "",
    project_key: "",
    email: "",
  },
  config: {
    epics_to_modules: false,
  },
  data: {
    users: [],
    invite_users: true,
    total_issues: 0,
    total_labels: 0,
    total_modules: 0,
    total_states: 0,
  },
  project_id: "",
};
