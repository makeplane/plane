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

import type { FC } from "react";
import type { TInstanceConfig, TMobileWorkspaceInvitation } from "@plane/types";
// plane web components
import { GitHubAuthButton } from "./github";
import { GoogleAuthButton } from "./google";
import { OIDCAuthButton } from "./oidc";
import { SAMLButton } from "./saml";

type TOAuthRoot = {
  invitationDetails: TMobileWorkspaceInvitation | undefined;
  config: TInstanceConfig;
};

export function OAuthRoot(props: TOAuthRoot) {
  const { invitationDetails, config } = props;

  // derived values
  const isOAuthEnabled =
    (config &&
      (config?.is_google_enabled || config?.is_github_enabled || config?.is_oidc_enabled || config?.is_saml_enabled)) ||
    false;
  const invitationId = invitationDetails?.id || undefined;

  if (!isOAuthEnabled) return null;
  return (
    <div className="relative space-y-6">
      <div className="mt-4 flex items-center pt-2">
        <hr className="w-full border-subtle" />
        <p className="mx-3 flex-shrink-0 text-center text-13 text-placeholder">or</p>
        <hr className="w-full border-subtle" />
      </div>

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
            <GitHubAuthButton title="Continue with GitHub" invitationId={invitationId} />
          </div>
        )}

        {/* oidc authentication */}
        {config?.is_oidc_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <OIDCAuthButton title={`Continue with ${config?.oidc_provider_name}`} invitationId={invitationId} />
          </div>
        )}

        {/* saml authentication */}
        {config?.is_saml_enabled && (
          <div className="flex h-[42px] items-center !overflow-hidden">
            <SAMLButton title={`Continue with ${config?.saml_provider_name}`} invitationId={invitationId} />
          </div>
        )}
      </div>
    </div>
  );
}
