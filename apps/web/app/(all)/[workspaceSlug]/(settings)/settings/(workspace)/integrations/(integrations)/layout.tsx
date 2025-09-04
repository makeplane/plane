"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { SILO_BASE_URL, SILO_BASE_PATH, E_FEATURE_FLAGS } from "@plane/constants";
// hooks
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
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
        <div className="w-full h-full">
          <Link
            href={`/${workspaceSlug}/settings/integrations`}
            className="flex items-center gap-2 text-sm font-semibold text-custom-text-300 mb-6"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to integrations
          </Link>
          <div className="w-full h-full">{children}</div>
        </div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
});

export default IntegrationLayout;
