import { E_IMPORTER_KEYS } from "@/core"
import { ContentParser } from "@/core/parser"
import { ExternalImageParserExtension, ExternalUserMentionParserExtension } from "@/core/parser/extensions/external"
import { ExternalFileParserExtension } from "@/core/parser/extensions/external/file-parser"
import { LinearContentParserConfig } from "../types"
import { LinearIssueMentionParserExtension, LinearProjectMentionParserExtension } from "./extensions"
import { LinearSectionParserExtension } from "./extensions/sections"


export const getContentParser = (config: LinearContentParserConfig) => {

  const fileHelperConfig = {
    planeClient: config.planeClient,
    workspaceSlug: config.workspaceSlug,
    projectId: config.projectId,
    externalSource: E_IMPORTER_KEYS.LINEAR,
    fileDownloadHeaders: config.fileDownloadHeaders,
  }

  const imageParserExtension = new ExternalImageParserExtension({
    ...fileHelperConfig,
  })
  const fileParserExtension = new ExternalFileParserExtension({
    ...fileHelperConfig,
    apiBaseUrl: config.apiBaseUrl,
    downloadableUrlPrefix: "https://uploads.linear.app",
  })
  const userMentionParserExtension = new ExternalUserMentionParserExtension({
    userMap: config.userMap,
  })

  const issueMentionParserExtension = new LinearIssueMentionParserExtension({
    workspaceSlug: config.workspaceSlug,
    projectId: config.projectId,
    planeClient: config.planeClient,
    linearService: config.linearService,
  })

  const projectMentionParserExtension = new LinearProjectMentionParserExtension({
    workspaceSlug: config.workspaceSlug,
    projectId: config.projectId,
    planeClient: config.planeClient,
    linearService: config.linearService,
    APP_BASE_URL: config.appBaseUrl ?? config.apiBaseUrl,
  })

  const sectionParserExtension = new LinearSectionParserExtension()

  return new ContentParser(
    [
      imageParserExtension,
      fileParserExtension,
      userMentionParserExtension,
      projectMentionParserExtension,
      issueMentionParserExtension,
    ], [sectionParserExtension])
}
