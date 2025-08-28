import { useContext } from "react";
import { LinearConfig } from "@plane/etl/linear";
// silo contexts
import { ImporterSyncJobContext, TImporterCreateContext } from "@/plane-web/silo/contexts";

export function useLinearSyncJobs() {
  const context = useContext<TImporterCreateContext<LinearConfig>>(ImporterSyncJobContext);

  if (!context) {
    throw new Error("useLinearSyncJobs must be used within an ImporterSyncJobContextProvider");
  }

  return context;
}
