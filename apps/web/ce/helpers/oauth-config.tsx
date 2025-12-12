// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { TOAuthOption } from "@plane/ui";
// assets
import GithubLightLogo from "@/app/assets/logos/github-black.png?url";
import GithubDarkLogo from "@/app/assets/logos/github-dark.svg?url";
import GitlabLogo from "@/app/assets/logos/gitlab-logo.svg?url";
import GiteaLogo from "@/app/assets/logos/gitea-logo.svg?url";
import GoogleLogo from "@/app/assets/logos/google-logo.svg?url";
import type { IInstanceConfig } from "@plane/types";

export type OAuthConfigParams = {
  OauthButtonContent: "Sign up" | "Sign in";
  next_path: string | null;
  config: IInstanceConfig | undefined;
  resolvedTheme: string | undefined;
};

export const isOAuthEnabled = (config: IInstanceConfig | undefined) =>
  (config &&
    (config?.is_google_enabled ||
      config?.is_github_enabled ||
      config?.is_gitlab_enabled ||
      config?.is_gitea_enabled)) ||
  false;

export function OAUTH_CONFIG({
  OauthButtonContent,
  next_path,
  config,
  resolvedTheme,
}: OAuthConfigParams): TOAuthOption[] {
  return [
    {
      id: "google",
      text: `${OauthButtonContent} with Google`,
      icon: <img src={GoogleLogo} className="h-4 w-4 object-contain" alt="Google Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/google/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_google_enabled || false,
    },
    {
      id: "github",
      text: `${OauthButtonContent} with GitHub`,
      icon: (
        <img
          src={resolvedTheme === "dark" ? GithubDarkLogo : GithubLightLogo}
          className="h-4 w-4 object-contain"
          alt="GitHub Logo"
        />
      ),
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/github/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_github_enabled || false,
    },
    {
      id: "gitlab",
      text: `${OauthButtonContent} with GitLab`,
      icon: <img src={GitlabLogo} className="h-4 w-4 object-contain" alt="GitLab Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/gitlab/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitlab_enabled || false,
    },
    {
      id: "gitea",
      text: `${OauthButtonContent} with Gitea`,
      icon: <img src={GiteaLogo} className="h-4 w-4 object-contain" alt="Gitea Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/gitea/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitea_enabled || false,
    },
  ];
}
