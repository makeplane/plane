// base components
import { getAuthenticationModes as getBaseAuthenticationModes } from "ce/components/authentication";

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
import { OIDCConfiguration, SAMLConfiguration } from "@/plane-admin/components/authentication";
// images
import OIDCLogo from "@/public/logos/oidc-logo.png";
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
      description: "Authenticate your users via the OpenID connect protocol.",
      icon: <Image src={OIDCLogo} height={20} width={20} alt="OIDC Logo" />,
      config: <OIDCConfiguration disabled={disabled} updateConfig={updateConfig} />,
    },
    {
      key: "saml",
      name: "SAML",
      description: "Authenticate your users via Security Assertion Markup Language protocol.",
      icon: <Image src={SAMLLogo} height={24} width={24} alt="SAML Logo" className="pb-0.5 pl-0.5" />,
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
        />
      ))}
    </>
  );
});
