import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// components
import { OIDCOAuthButton } from "./oidc-button";
import { SAMLOAuthButton } from "./saml-button";

export const EnterpriseOAuthOptions = observer(() => {
  // hooks
  const { config } = useInstance();

  return (
    <>
      {config?.is_oidc_enabled && (
        <OIDCOAuthButton text={`Continue with ${!!config?.oidc_provider_name ? config.oidc_provider_name : "OIDC"}`} />
      )}
      {config?.is_saml_enabled && (
        <SAMLOAuthButton text={`Continue with ${!!config?.saml_provider_name ? config.saml_provider_name : "SAML"}`} />
      )}
    </>
  );
});
