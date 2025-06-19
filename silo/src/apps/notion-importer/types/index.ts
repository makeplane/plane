import { TZipFileNode } from "@/lib/zip-manager";

export enum ENotionImporterKeyType {
  PAGE = 'PAGE',
  ASSET = 'ASSET',
  JOB = 'JOB',
  JOB_CREDENTIALS = 'JOB_CREDENTIALS',
  LEAF_NODE_COUNTER = 'LEAF_NODE_COUNTER',
}

export type TNotionImportConfig = {
  fileId: string;
}

export type TNotionMigratorData = {
  // Name of the zip file that we are going to process
  fileId: string;

  // Current node that we are processing
  node?: TZipFileNode;

  // Parent page id
  parentPageId?: string;
}

export enum ENotionMigrationType {
  // The job runner is generic for all the importers hence, when the import will be triggered
  // it will be triggered with `initiate`, we can't make it to say PHASE_ONE, PHASE_TWO, etc.
  PHASE_ONE = "initiate",
  PHASE_TWO = "phase-two",
}


export type TNotionContentParserConfig = {
  fileId: string;
  assetMap: Map<string, string>;
  pageMap: Map<string, string>;
  workspaceSlug: string;
  apiBaseUrl: string;
};
