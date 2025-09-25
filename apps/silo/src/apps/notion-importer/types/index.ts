import { TZipFileNode } from "@/lib/zip-manager";
import { EZipDriverType } from "../drivers";

export enum ENotionImporterKeyType {
  PAGE = "PAGE",
  ASSET = "ASSET",
  JOB = "JOB",
  JOB_CREDENTIALS = "JOB_CREDENTIALS",
  LEAF_NODE_COUNTER = "LEAF_NODE_COUNTER",
}

export type TNotionImportConfig = {
  fileId: string;
};

export type TNotionMigratorData = {
  // Type of the driver that we are going to use
  type: EZipDriverType;

  // Name of the zip file that we are going to process
  fileId: string;

  // Current node that we are processing
  node?: TZipFileNode;

  // Parent page id
  parentPageId?: string;
};

export enum ENotionMigrationType {
  // The job runner is generic for all the importers hence, when the import will be triggered
  // it will be triggered with `initiate`, we can't make it to say PHASE_ONE, PHASE_TWO, etc.
  PHASE_ONE = "initiate",
  PHASE_TWO = "phase-two",
}

export type TDocContentParserConfig = {
  fileId: string;
  assetMap: Map<string, string>;
  pageMap: Map<string, string>;
  workspaceSlug: string;
  apiBaseUrl: string;
  context?: Map<string, string>;
};

export type TAssetInfo = {
  id: string;
  name: string;
  type: string;
  size: number;
};

export type TCalloutConfig = {
  icon: string;
  color: string;
  background?: string;
};

export enum EDocImporterDestinationType {
  WIKI = "wiki",
  PROJECT = "project",
  TEAMSPACE = "teamspace",
}

type TDocImporterDestination =
  | {
      type: EDocImporterDestinationType.WIKI;
    }
  | {
      type: EDocImporterDestinationType.PROJECT;
      project_id: string;
      project_name: string;
    }
  | {
      type: EDocImporterDestinationType.TEAMSPACE;
      teamspace_id: string;
      teamspace_name: string;
    };

export type TDocImporterJobConfig = {
  fileId: string;
  fileName: string;
  destination: TDocImporterDestination;
  metadata?: {
    rootNodeUrl?: string;
  };
};
