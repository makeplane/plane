"use client";

import { observer } from "mobx-react-lite";
// components
import { GithubOAuthButton, GoogleOAuthButton } from "@/components/accounts";
// hooks
import { useInstance } from "@/hooks/store";

export const OAuthOptions: React.FC = observer(() => {
  // hooks
  const { config: instanceConfig } = useInstance();

  return (
    <>
      <div className="mx-auto mt-4 flex items-center sm:w-96">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">or</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>
      <div className={`mx-auto mt-7 grid gap-4 overflow-hidden sm:w-96`}>
        {instanceConfig?.is_google_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GoogleOAuthButton text="SignIn with Google" />
          </div>
        )}
        {instanceConfig?.is_github_enabled && <GithubOAuthButton text="SignIn with Github" />}
      </div>
    </>
  );
});
