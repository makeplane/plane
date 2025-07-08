import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IZipImporterStore } from "@/plane-web/store/importers";
import { EZipDriverType } from "@/plane-web/types/importers/zip-importer";

export const useZipImporter = (type: EZipDriverType): IZipImporterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useZipImporter must be used within StoreProvider");

  return type === EZipDriverType.CONFLUENCE ? context.confluenceImporter : context.notionImporter;
};
