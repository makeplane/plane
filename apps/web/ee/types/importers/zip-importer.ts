// plane web types
import { TStepperBlock } from "@/plane-web/types/importers";

// importer steps types
export enum E_IMPORTER_STEPS {
  SELECT_DESTINATION = "select-destination",
  UPLOAD_ZIP = "upload-zip",
}
export type TImporterStepKeys = E_IMPORTER_STEPS.UPLOAD_ZIP | E_IMPORTER_STEPS.SELECT_DESTINATION;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_DESTINATION]: {
    destination: TDocImporterDestination;
  };
  [E_IMPORTER_STEPS.UPLOAD_ZIP]: {
    zipFile: File | undefined;
  };
};

export enum EZipDriverType {
  NOTION = "notion",
  CONFLUENCE = "confluence",
}

export type TZipImporterProps = {
  driverType: EZipDriverType;
  logo: string;
  serviceName: string;
};

export enum EDocImporterDestinationType {
  WIKI = "wiki",
  PROJECT = "project",
  TEAMSPACE = "teamspace",
}

type TDocImporterDestination = {
  type: EDocImporterDestinationType.WIKI;
} | {
  type: EDocImporterDestinationType.PROJECT;
  project_id: string;
  project_name: string;
} | {
  type: EDocImporterDestinationType.TEAMSPACE;
  teamspace_id: string;
  teamspace_name: string;
}

export type TDocImporterJobConfig = {
  fileId: string;
  fileName: string;
  metadata?: {
    rootNodeUrl?: string;
  }
  destination: TDocImporterDestination;
}
