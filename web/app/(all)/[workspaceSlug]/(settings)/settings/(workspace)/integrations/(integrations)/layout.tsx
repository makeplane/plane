"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SILO_BASE_URL, SILO_BASE_PATH, E_FEATURE_FLAGS } from "@plane/constants";
// hooks
import { SettingsContentWrapper } from "@/components/settings";
import { useUser, useUserProfile, useWorkspace } from "@/hooks/store";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IntegrationsEmptyState } from "@/plane-web/components/integrations";

type TIntegrationLayout = {
  children: ReactNode;
};

const IntegrationLayout: FC<TIntegrationLayout> = observer((props) => {
  const { children } = props;

  // router params
  const { workspaceSlug: workspaceSlugParam } = useParams();

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile } = useUserProfile();

  // derived values
  const siloBaseUrl = encodeURI(SILO_BASE_URL + SILO_BASE_PATH) || undefined;
  const workspaceSlug = workspaceSlugParam?.toString() || undefined;
  const workspaceId = currentWorkspace?.id || undefined;
  const userId = currentUser?.id || undefined;

  // check if workspace exists
  if (!workspaceSlug || !workspaceId || !userId || !siloBaseUrl) return null;

  return (
    <WithFeatureFlagHOC
      flag={E_FEATURE_FLAGS.SILO_INTEGRATIONS}
      workspaceSlug={workspaceSlug}
      fallback={<IntegrationsEmptyState theme={currentUserProfile?.theme.theme || "light"} />}
    >
      <SettingsContentWrapper size="lg">
        <div className="w-full h-full">{children}</div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
});

export default IntegrationLayout;
