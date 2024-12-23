"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane web components components
import { E_FEATURE_FLAGS } from "@plane/constants";
// import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { UserAuthentication, IntegrationRoot } from "@/plane-web/components/integrations/github";
// plane web hooks
import { useFlag, useGithubIntegration } from "@/plane-web/hooks/store";
// public images
import GithubDarkLogo from "@/public/services/github-dark.svg";
import GithubLightLogo from "@/public/services/github-light.svg";

const GitHubIntegration: FC = observer(() => {
  // hooks
  const { resolvedTheme } = useTheme();
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGithubIntegration();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITHUB_INTEGRATION) || true;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  if (!isFeatureEnabled) return null;

  if (!externalApiToken && externalApiTokenIsLoading)
    return <div className="text-custom-text-200 relative flex justify-center items-center">Loading...</div>;

  if (!externalApiToken)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <div className="relative space-y-10">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90/50 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={githubLogo} layout="fill" objectFit="contain" alt="GitHub Logo" />
        </div>
        <div>
          <div className="text-lg font-medium">GitHub</div>
          <div className="text-sm text-custom-text-200">
            Automate your pull request and commit workflows and keep issues synced both ways
          </div>
        </div>
      </div>

      {/* integration auth root */}
      <UserAuthentication />

      {/* integration root */}
      {organization && <IntegrationRoot />}
    </div>
  );
});

export default GitHubIntegration;
