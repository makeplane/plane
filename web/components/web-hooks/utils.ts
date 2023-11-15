import { renderDateFormat } from "helpers/date-time.helper";
import { IWebhook, IWorkspace } from "types";

export const getCurrentHookAsCSV = (
  currentWorkspace: IWorkspace | null,
  webhook: IWebhook | undefined,
  secretKey: string | undefined
) => ({
  id: webhook?.id || "",
  url: webhook?.url || "",
  created_at: renderDateFormat(webhook?.created_at),
  updated_at: renderDateFormat(webhook?.updated_at),
  is_active: webhook?.is_active?.toString() || "",
  secret_key: secretKey || "",
  project: webhook?.project?.toString() || "",
  issue: webhook?.issue?.toString() || "",
  module: webhook?.module?.toString() || "",
  cycle: webhook?.cycle?.toString() || "",
  issue_comment: webhook?.issue_comment?.toString() || "",
  workspace: currentWorkspace?.name || "",
});
