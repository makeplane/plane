// plane web types
import { TStepperBlock } from "@/plane-web/types/importers";

// importer steps types
export enum E_IMPORTER_STEPS {
  UPLOAD_ZIP = "upload-zip",
}
export type TImporterStepKeys = E_IMPORTER_STEPS.UPLOAD_ZIP;

export type TImporterStep = TStepperBlock<TImporterStepKeys>;

// Importer steps form-data types
export type TImporterDataPayload = {
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
