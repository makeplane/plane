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
import { useTheme } from "@plane/react-theme";
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthConfigs, TOAuthOption } from "@plane/types";
// assets
import giteaLogo from "@/app/assets/logos/gitea-logo.svg?url";
import githubLightLogo from "@/app/assets/logos/github-black.png?url";
import githubDarkLogo from "@/app/assets/logos/github-dark.svg?url";
import gitlabLogo from "@/app/assets/logos/gitlab-logo.svg?url";
import googleLogo from "@/app/assets/logos/google-logo.svg?url";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

export const useCoreOAuthConfig = (oauthActionText: string): TOAuthConfigs => {
  //router
  const searchParams = useSearchParams();
  // query params
  const next_path = searchParams.get("next_path");
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { config } = useInstance();
  // derived values
  const isOAuthEnabled =
    (config &&
      (config?.is_google_enabled ||
        config?.is_github_enabled ||
        config?.is_gitlab_enabled ||
        config?.is_gitea_enabled)) ||
    false;
  const oAuthOptions: TOAuthOption[] = [
    {
      id: "google",
      text: `${oauthActionText} with Google`,
      icon: <img src={googleLogo} height={18} width={18} alt="Google Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/spaces/google/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_google_enabled,
    },
    {
      id: "github",
      text: `${oauthActionText} with GitHub`,
      icon: (
        <img
          src={resolvedTheme === "dark" ? githubLightLogo : githubDarkLogo}
          height={18}
          width={18}
          alt="GitHub Logo"
        />
      ),
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/spaces/github/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_github_enabled,
    },
    {
      id: "gitlab",
      text: `${oauthActionText} with GitLab`,
      icon: <img src={gitlabLogo} height={18} width={18} alt="GitLab Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/spaces/gitlab/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitlab_enabled,
    },
    {
      id: "gitea",
      text: `${oauthActionText} with Gitea`,
      icon: <img src={giteaLogo} height={18} width={18} alt="Gitea Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/spaces/gitea/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitea_enabled,
    },
  ];

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
