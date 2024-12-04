// types
import { TStepperBlock } from "@/plane-web/silo/types/ui";

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
