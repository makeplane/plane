// plane web types
import { TStepperBlock } from "@/plane-web/types/importers";

// importer steps types
export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_FLATFILE = "configure-flatfile",
}
export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_FLATFILE;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_FLATFILE]: {
    workbookId: string | undefined
    environmentId: string | undefined
    spaceId: string | undefined
    appId: string | undefined
    jobId: string | undefined
    actorId: string | undefined
  };
};
