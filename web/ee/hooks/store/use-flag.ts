import { useContext } from "react";
import { E_FEATURE_FLAGS } from "@plane/constants";
// context
import { StoreContext } from "@/lib/store-context";

export const useFlag = (
  workspaceSlug: string | undefined,
  flag: keyof typeof E_FEATURE_FLAGS,
  defaultValue: boolean = false
): boolean => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFlag must be used within StoreProvider");
  if (!workspaceSlug) return defaultValue;
  return context.featureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
};
