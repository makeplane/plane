import { E_IMPORTER_KEYS } from "@/core";
import { ContentParser } from "@/parser";
import { ExternalFileParserExtension } from "@/parser/extensions/external/file-parser";
import { ExternalImageParserExtension } from "@/parser/extensions/external/image-parser";
import { ClickUpContentParserConfig } from "../types";

export const getClickUpContentParser = (config: ClickUpContentParserConfig) => {
  const fileHelperConfig = {
    planeClient: config.planeClient,
    workspaceSlug: config.workspaceSlug,
    projectId: config.projectId,
    externalSource: E_IMPORTER_KEYS.CLICKUP,
    fileDownloadHeaders: config.fileDownloadHeaders,
  };

  const imageParserExtension = new ExternalImageParserExtension({
    ...fileHelperConfig,
  });

  const fileParserExtension = new ExternalFileParserExtension({
    ...fileHelperConfig,
    apiBaseUrl: config.apiBaseUrl,
    downloadableUrlPrefix: "https://t",
  });

  return new ContentParser([imageParserExtension, fileParserExtension]);
};
