import { TClickUpAuthState } from "@plane/etl/clickup";
// plane web types
import { TStepperBlock } from "@/plane-web/types/importers";

// authentication PAT form field types
export type TClickUpPATFormFields = Omit<
  TClickUpAuthState,
  "workspaceId" | "workspaceSlug" | "userId" | "appInstallationId"
>;

// importer steps types
export enum E_CLICKUP_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_CLICKUP = "configure-clickup",
  MAP_STATES = "map-states",
  MAP_PRIORITIES = "map-priorities",
  SUMMARY = "summary",
}
export type TClickUpImporterStepKeys =
  | E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP
  | E_CLICKUP_IMPORTER_STEPS.MAP_STATES
  | E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES
  | E_CLICKUP_IMPORTER_STEPS.SUMMARY;

export type TClickUpImporterStep = TStepperBlock<TClickUpImporterStepKeys>;

// Importer steps form-data types
export type TImporterClickUpDataPayload = {
  [E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]: {
    teamId: string | undefined;
    spaceId: string | undefined;
    folderIds: string[];
  };
  [E_CLICKUP_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES]: {
    [key: string]: string | undefined;
  };
  [E_CLICKUP_IMPORTER_STEPS.SUMMARY]: {
    skipUserImport: boolean;
  };
};
