import { useContext } from "react";
// silo contexts
import { ImporterBaseContext } from "@/plane-web/silo/contexts";

export function useBaseImporter() {
  const context = useContext(ImporterBaseContext);

  if (!context) {
    throw new Error("useBaseImporter must be used within an ImportBaseContextProvider");
  }

  return context;
}
