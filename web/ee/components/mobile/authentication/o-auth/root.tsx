"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store";
// plane web components
import { GoogleAuthButton, GitHubAuthButton } from "@/plane-web/components/mobile";

export const OAuthRoot: FC = observer(() => {
  // hooks
  const { config } = useInstance();

  console.log("config,config", config);

  // derived values
  const isOAuthEnabled = (config && (config?.is_google_enabled || config?.is_github_enabled)) || false;

  if (!isOAuthEnabled) return null;
  return (
    <div className="relative space-y-6">
      <div className="mt-4 flex items-center">
        <hr className="w-full border-onboarding-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-onboarding-text-400">or</p>
        <hr className="w-full border-onboarding-border-100" />
      </div>

      <div className="space-y-2">
        {/* google authentication */}
        {config?.is_google_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GoogleAuthButton title="Continue with Google" />
          </div>
        )}

        {/* github authentication */}
        {config?.is_github_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GitHubAuthButton title="Continue with Github" />
          </div>
        )}
      </div>
    </div>
  );
});
