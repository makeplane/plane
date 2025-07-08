import { useContext } from "react";
import { JiraConfig } from "@plane/etl/jira";
// silo contexts
import { ImporterSyncJobContext, TImporterCreateContext } from "@/plane-web/silo/contexts";

export function useJiraSyncJobs() {
  const context = useContext<TImporterCreateContext<JiraConfig>>(ImporterSyncJobContext);

  if (!context) {
    throw new Error("useJiraSyncJobs must be used within an ImporterSyncJobContextProvider");
  }

  return context;
}
