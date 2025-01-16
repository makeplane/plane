// types
import { TStepperBlock } from "@/plane-web/silo/types/ui";

export enum E_IMPORTER_STEPS {
  SELECT_PLANE_PROJECT = "select-plane-project",
  CONFIGURE_LINEAR = "configure-linear",
  MAP_STATES = "map-states",
  SUMMARY = "summary",
}

export type TImporterStepKeys =
  | E_IMPORTER_STEPS.SELECT_PLANE_PROJECT
  | E_IMPORTER_STEPS.CONFIGURE_LINEAR
  | E_IMPORTER_STEPS.MAP_STATES
  | E_IMPORTER_STEPS.SUMMARY;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;
