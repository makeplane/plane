import { observer } from "mobx-react";
// components
import { GithubOAuthButton, GoogleOAuthButton } from "@/components/account";
// hooks
import { useInstance } from "@/hooks/store";

type TOAuthOptionProps = {
  isSignUp?: boolean;
};

export const OAuthOptions: React.FC<TOAuthOptionProps> = observer((props) => {
  const { isSignUp = false } = props;
  // hooks
  const { config } = useInstance();

  const isOAuthEnabled = (config && (config?.is_google_enabled || config?.is_github_enabled)) || false;

  if (!isOAuthEnabled) return null;

  const oauthProviderButtonText = `Sign ${isSignUp ? "up" : "in"} with`;

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
            <GoogleOAuthButton text={`${oauthProviderButtonText} Google`} />
          </div>
        )}
        {config?.is_github_enabled && <GithubOAuthButton text={`${oauthProviderButtonText} Github`} />}
      </div>
    </>
  );
});
