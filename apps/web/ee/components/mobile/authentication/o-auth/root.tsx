"use client";

import { FC } from "react";
import { TInstanceConfig, TMobileWorkspaceInvitation } from "@plane/types";
// plane web components
import { GitHubAuthButton } from "./github";
import { GoogleAuthButton } from "./google";

type TOAuthRoot = {
  invitationDetails: TMobileWorkspaceInvitation | undefined;
  config: TInstanceConfig;
};

export const OAuthRoot: FC<TOAuthRoot> = (props) => {
  const { invitationDetails, config } = props;

  // derived values
  const isOAuthEnabled = (config && (config?.is_google_enabled || config?.is_github_enabled)) || false;
  const invitationId = invitationDetails?.id || undefined;

  if (!isOAuthEnabled) return null;
  return (
    <div className="relative space-y-6">
      <div className="space-y-2">
        {/* google authentication */}
        {config?.is_google_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GoogleAuthButton title="Continue with Google" invitationId={invitationId} />
          </div>
        )}

        {/* github authentication */}
        {config?.is_github_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <GitHubAuthButton title="Continue with Github" invitationId={invitationId} />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center pt-2">
        <hr className="w-full border-custom-border-100" />
        <p className="mx-3 flex-shrink-0 text-center text-sm text-custom-text-400">or</p>
        <hr className="w-full border-custom-border-100" />
      </div>
    </div>
  );
};
