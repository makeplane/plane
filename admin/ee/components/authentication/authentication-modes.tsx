import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// types
import {
  TInstanceAuthenticationMethodKeys as TBaseAuthenticationMethods,
  TInstanceAuthenticationModes,
  TInstanceEnterpriseAuthenticationMethodKeys,
} from "@plane/types";
// components
import { AuthenticationMethodCard } from "@/components/authentication";
// helpers
import { getBaseAuthenticationModes } from "@/helpers/authentication.helper";
// plane admin components
import { OIDCConfiguration, SAMLConfiguration } from "@/plane-admin/components/authentication";
// images
import OIDCLogo from "@/public/logos/oidc-logo.svg";
import SAMLLogo from "@/public/logos/saml-logo.svg";

type TInstanceAuthenticationMethodKeys = TBaseAuthenticationMethods | TInstanceEnterpriseAuthenticationMethodKeys;

export type TAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
};

export type TGetAuthenticationModeProps = {
  disabled: boolean;
  updateConfig: (key: TInstanceAuthenticationMethodKeys, value: string) => void;
  resolvedTheme: string | undefined;
};

// Enterprise authentication methods
export const getAuthenticationModes: (props: TGetAuthenticationModeProps) => TInstanceAuthenticationModes[] = ({
  disabled,
  updateConfig,
  resolvedTheme,
}) => [
    ...getBaseAuthenticationModes({ disabled, updateConfig, resolvedTheme }),
    {
      key: "oidc",
      name: "OIDC",
      description: "Authenticate your users via the OpenID Connect protocol.",
      icon: <Image src={OIDCLogo} height={22} width={22} alt="OIDC Logo" />,
      config: <OIDCConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
    {
      key: "saml",
      name: "SAML",
      description: "Authenticate your users via the Security Assertion Markup Language protocol.",
      icon: <Image src={SAMLLogo} height={22} width={22} alt="SAML Logo" className="pl-0.5" />,
      config: <SAMLConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
  ];

export const AuthenticationModes: React.FC<TAuthenticationModeProps> = observer((props) => {
  const { disabled, updateConfig } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <>
      {getAuthenticationModes({ disabled, updateConfig, resolvedTheme }).map((method) => (
        <AuthenticationMethodCard
          key={method.key}
          name={method.name}
          description={method.description}
          icon={method.icon}
          config={method.config}
          disabled={disabled}
          unavailable={method.unavailable}
        />
      ))}
    </>
  );
});
