import Image from "next/image";
// plane imports
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "@plane/constants";
// assets
import GithubLightLogo from "/public/logos/github-black.png";
import GithubDarkLogo from "/public/logos/github-dark.svg";
import GitlabLogo from "/public/logos/gitlab-logo.svg";
import GoogleLogo from "/public/logos/google-logo.svg";
import GiteaLogo from "/public/logos/gitea-logo.svg";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// local imports
import type { TOAuthConfigs } from "./types";

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
  const oAuthOptions = [
    {
      id: "google",
      text: `${oauthActionText} with Google`,
      icon: <Image src={GoogleLogo} height={18} width={18} alt="Google Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/google/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_google_enabled,
    },
    {
      id: "github",
      text: `${oauthActionText} with GitHub`,
      icon: (
        <Image
          src={resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo}
          height={18}
          width={18}
          alt="GitHub Logo"
        />
      ),
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/github/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_github_enabled,
    },
    {
      id: "gitlab",
      text: `${oauthActionText} with GitLab`,
      icon: <Image src={GitlabLogo} height={18} width={18} alt="GitLab Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/gitlab/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitlab_enabled,
    },
    {
      id: "gitea",
      text: `${oauthActionText} with Gitea`,
      icon: <Image src={GiteaLogo} height={18} width={18} alt="Gitea Logo" />,
      onClick: () => {
        window.location.assign(`${API_BASE_URL}/auth/gitea/${next_path ? `?next_path=${next_path}` : ``}`);
      },
      enabled: config?.is_gitea_enabled,
    },
  ];

  return {
    isOAuthEnabled,
    oAuthOptions,
  };
};
