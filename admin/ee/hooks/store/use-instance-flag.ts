import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-provider";

export enum E_FEATURE_FLAGS {
  OIDC_SAML_AUTH = "OIDC_SAML_AUTH",
}

export const useInstanceFlag = (flag: keyof typeof E_FEATURE_FLAGS, defaultValue: boolean = false): boolean => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstanceFlag must be used within StoreProvider");
  return context.instanceFeatureFlags.flags?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
};
