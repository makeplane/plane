import { ZipManager } from "@/lib/zip-manager";
import { ConfluenceImportDriver } from "./confluence/driver";
import { NotionImportDriver } from "./notion/driver";
import { IZipImportDriver } from "./types";

export enum EZipDriverType {
  NOTION = "NOTION",
  CONFLUENCE = "CONFLUENCE",
}

/**
 * Factory class for creating the tree builder based on the type
 */
export class ZipDriverFactory {
  static getDriver(type: EZipDriverType, zipManager: ZipManager): IZipImportDriver {
    switch (type) {
      case EZipDriverType.NOTION:
        return new NotionImportDriver(zipManager);
      case EZipDriverType.CONFLUENCE:
        return new ConfluenceImportDriver(zipManager);
      default:
        throw new Error("Invalid tree builder type");
    }
  }
}
