/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { useNavigate } from "react-router";
import { useSearchParams } from "next/navigation";
import { Key } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs, TOAuthOption } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { isDesktop } from "@/hooks/use-desktop";

export const useExtendedOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  // router
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  // query params
  const next_path = searchParams.get("next_path");
  // store hooks
  const { config } = useInstance();
  // derived values
  const oAuthOptions: TOAuthOption[] = [
    {
      id: "oidc",
      text: `${oauthActionText} with ${config?.oidc_provider_name ? config.oidc_provider_name : "OIDC"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/oidc/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_oidc_enabled && !isDesktop(),
    },
    {
      id: "saml",
      text: `${oauthActionText} with ${config?.saml_provider_name ? config.saml_provider_name : "SAML"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/saml/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_saml_enabled && !isDesktop(),
    },
    {
      id: "ldap",
      text: `${oauthActionText} with ${config?.ldap_provider_name ? config.ldap_provider_name : "LDAP"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        void navigate("/ldap");
      },
      enabled: config?.is_ldap_enabled && !isDesktop(),
    },
    {
      id: "sso",
      text: `${oauthActionText} with Single Sign-On`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        void navigate("/sso");
      },
      enabled: config?.is_self_managed === false && !isDesktop(),
    },
  ];
  const isOAuthEnabled = oAuthOptions.some((option) => option.enabled);

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
