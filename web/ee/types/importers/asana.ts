import { AsanaPATAuthState } from "@plane/etl/asana";
// plane web types
import { TStepperBlock } from "@/plane-web/silo/types/ui";

// authentication PAT form field types
export type TAsanaPATFormFields = Omit<AsanaPATAuthState, "workspaceId" | "userId" | "apiToken">;

export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_ASANA = "configure-asana",
  MAP_STATES = "map-states",
  MAP_PRIORITY = "map-priority",
  SUMMARY = "summary",
}

export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_ASANA
  | E_IMPORTER_STEPS.MAP_STATES
  | E_IMPORTER_STEPS.MAP_PRIORITY
  | E_IMPORTER_STEPS.SUMMARY;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_ASANA]: {
    workspaceGid: string | undefined;
    projectGid: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    customFieldGid: string | undefined;
    priorityMap: {
      [key: string]: string | undefined;
    };
  };
};
