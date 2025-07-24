import { JiraPATAuthState } from "@plane/etl/jira";
// plane web types
import { TStepperBlock } from "@/plane-web/types/importers";

// authentication PAT form field types
export type TJiraPATFormFields = Omit<JiraPATAuthState, "workspaceId" | "userId" | "apiToken">;

// importer steps types
export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_JIRA = "configure-jira",
  IMPORT_USERS_FROM_JIRA = "import-users-from-jira",
  MAP_STATES = "map-states",
  MAP_PRIORITY = "map-priority",
  SUMMARY = "summary",
}
export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_JIRA
  | E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA
  | E_IMPORTER_STEPS.MAP_STATES
  | E_IMPORTER_STEPS.MAP_PRIORITY
  | E_IMPORTER_STEPS.SUMMARY;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
    resourceId: string | undefined;
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA]: {
    userSkipToggle: boolean;
    userData: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    [key: string]: string | undefined;
  };
};
