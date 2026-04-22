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

import { useNavigate } from "react-router";
import { useTheme } from "@plane/react-theme";
import { Key } from "lucide-react";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs, TOAuthOption } from "@plane/types";
import { resolveGeneralTheme } from "@plane/utils";
// assets
import giteaLogo from "@/app/assets/logos/gitea-logo.svg?url";
import githubLightModeImage from "@/app/assets/logos/github-black.png?url";
import githubDarkModeImage from "@/app/assets/logos/github-white.png?url";
import gitlabLogo from "@/app/assets/logos/gitlab-logo.svg?url";
import googleLogo from "@/app/assets/logos/google-logo.svg?url";
// hooks
import { useInstance } from "@/hooks/store";

export const useAdminOAuthSignIn = (): TOAuthConfigs => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { config } = useInstance();

  const oAuthOptions: TOAuthOption[] = [
    {
      id: "google",
      text: "Sign in with Google",
      icon: <img src={googleLogo} height={18} width={18} alt="Google Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/google/`);
      },
      enabled: config?.is_google_enabled,
    },
    {
      id: "github",
      text: "Sign in with GitHub",
      icon: (
        <img
          src={resolveGeneralTheme(resolvedTheme) === "dark" ? githubDarkModeImage : githubLightModeImage}
          height={18}
          width={18}
          alt="GitHub Logo"
        />
      ),
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/github/`);
      },
      enabled: config?.is_github_enabled,
    },
    {
      id: "gitlab",
      text: "Sign in with GitLab",
      icon: <img src={gitlabLogo} height={18} width={18} alt="GitLab Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/gitlab/`);
      },
      enabled: config?.is_gitlab_enabled,
    },
    {
      id: "gitea",
      text: "Sign in with Gitea",
      icon: <img src={giteaLogo} height={18} width={18} alt="Gitea Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/gitea/`);
      },
      enabled: config?.is_gitea_enabled,
    },
    {
      id: "oidc",
      text: `Sign in with ${config?.oidc_provider_name || "OIDC"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/oidc/`);
      },
      enabled: config?.is_oidc_enabled,
    },
    {
      id: "saml",
      text: `Sign in with ${config?.saml_provider_name || "SAML"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/api/instances/admin/saml/`);
      },
      enabled: config?.is_saml_enabled,
    },
    {
      id: "ldap",
      text: `Sign in with ${config?.ldap_provider_name || "LDAP"}`,
      icon: <Key height={18} width={18} />,
      onClick: () => {
        void navigate("/ldap");
      },
      enabled: config?.is_ldap_enabled,
    },
  ];

  const isOAuthEnabled = oAuthOptions.some((option) => option.enabled);

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
