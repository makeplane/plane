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
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs, TOAuthOption } from "@plane/types";
// assets
import giteaLogo from "@/app/assets/logos/gitea-logo.svg?url";
import GithubLightLogo from "@/app/assets/logos/github-black.png?url";
import GithubDarkLogo from "@/app/assets/logos/github-dark.svg?url";
import gitlabLogo from "@/app/assets/logos/gitlab-logo.svg?url";
import googleLogo from "@/app/assets/logos/google-logo.svg?url";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { getDesktopAPI, isDesktop } from "@/hooks/use-desktop";

// Providers that have desktop OAuth endpoints
const DESKTOP_OAUTH_PROVIDERS = new Set(["google", "github", "gitlab", "gitea"]);

// Helper to handle OAuth navigation
const handleOAuthNavigation = async (provider: string, next_path: string | null) => {
  const params = new URLSearchParams();
  if (next_path) params.set("next_path", next_path);
  if (isDesktop() && DESKTOP_OAUTH_PROVIDERS.has(provider)) {
    const planeDesktop = getDesktopAPI();
    // Start PKCE flow — generate code_verifier in main process, get code_challenge
    const pkce = await planeDesktop.startPKCEFlow();
    params.set("code_challenge", pkce.code_challenge);
    params.set("challenge_method", pkce.challenge_method);

    const desktopOAuthUrl = `${API_BASE_URL}/auth/desktop/${provider}/?${params.toString()}`;
    planeDesktop.openExternal(desktopOAuthUrl);
  } else {
    // For web or unsupported desktop providers, navigate directly
    window.location.assign(`${API_BASE_URL}/auth/${provider}/?${params.toString()}`);
  }
};

export const useCoreOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  //router
  const searchParams = useSearchParams();
  // query params
  const next_path = searchParams.get("next_path");
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { config } = useInstance();
  // derived options
  const oAuthOptions: TOAuthOption[] = [
    {
      id: "google",
      text: `${oauthActionText} with Google`,
      icon: <img src={googleLogo} height={18} width={18} alt="Google Logo" />,
      onClick: () => void handleOAuthNavigation("google", next_path),
      enabled: config?.is_google_enabled,
    },
    {
      id: "github",
      text: `${oauthActionText} with GitHub`,
      icon: (
        <img
          src={resolvedTheme === "dark" ? GithubDarkLogo : GithubLightLogo}
          height={18}
          width={18}
          alt="GitHub Logo"
        />
      ),
      onClick: () => void handleOAuthNavigation("github", next_path),
      enabled: config?.is_github_enabled,
    },
    {
      id: "gitlab",
      text: `${oauthActionText} with GitLab`,
      icon: <img src={gitlabLogo} height={18} width={18} alt="GitLab Logo" />,
      onClick: () => void handleOAuthNavigation("gitlab", next_path),
      enabled: config?.is_gitlab_enabled,
    },
    {
      id: "gitea",
      text: `${oauthActionText} with Gitea`,
      icon: <img src={giteaLogo} height={18} width={18} alt="Gitea Logo" />,
      onClick: () => void handleOAuthNavigation("gitea", next_path),
      enabled: config?.is_gitea_enabled,
    },
  ];
  const isOAuthEnabled = oAuthOptions.some((option) => option.enabled);

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
