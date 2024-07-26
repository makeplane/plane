import { observer } from "mobx-react";
// components
import { GithubOAuthButton, GitlabOAuthButton, GoogleOAuthButton } from "@/components/account";
// hooks
import { useInstance } from "@/hooks/store";

type TOAuthOptionProps = {
  isSignUp?: boolean;
};

export const OAuthOptions: React.FC<TOAuthOptionProps> = observer(() => {
  // hooks
  const { config } = useInstance();

  const isOAuthEnabled = (config && (config?.is_google_enabled || config?.is_github_enabled || config?.is_gitlab_enabled)) || false;

  if (!isOAuthEnabled) return null;

  return (
    <>
      <div className="mt-4 flex items-center">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">or</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>
      <div className={`mt-7 grid gap-4 overflow-hidden`}>
        {config?.is_google_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GoogleOAuthButton text="Continue with Google" />
          </div>
        )}
        {config?.is_github_enabled && <GithubOAuthButton text="Continue with Github" />}
        {config?.is_gitlab_enabled && <GitlabOAuthButton text="Continue with GitLab" />}
      </div>
    </>
  );
});
