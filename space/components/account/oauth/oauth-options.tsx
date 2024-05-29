import { observer } from "mobx-react-lite";
// components
import { GithubOAuthButton, GoogleOAuthButton } from "@/components/account";
// hooks
import { useInstance } from "@/hooks/store";

export const OAuthOptions: React.FC = observer(() => {
  // hooks
  const { config } = useInstance();

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
            <GoogleOAuthButton text="Sign in with Google" />
          </div>
        )}
        {config?.is_github_enabled && <GithubOAuthButton text="Sign in with Github" />}
      </div>
    </>
  );
});
