import { useContext } from "react";
// contexts
import { ImporterContext } from "@/plane-web/silo/linear/contexts";

export function useImporter() {
  const context = useContext(ImporterContext);

  if (!context) {
    throw new Error("useImporter must be used within an ImportContextProvider");
  }

  return context;
}
