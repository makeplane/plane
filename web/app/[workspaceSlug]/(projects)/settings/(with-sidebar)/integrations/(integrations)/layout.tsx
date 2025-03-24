"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SILO_BASE_URL, SILO_BASE_PATH } from "@plane/constants";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";

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

  // derived values
  const siloBaseUrl = encodeURI(SILO_BASE_URL + SILO_BASE_PATH) || undefined;
  const workspaceSlug = workspaceSlugParam?.toString() || undefined;
  const workspaceId = currentWorkspace?.id || undefined;
  const userId = currentUser?.id || undefined;

  // check if workspace exists
  if (!workspaceSlug || !workspaceId || !userId || !siloBaseUrl) return null;

  return children;
});

export default IntegrationLayout;
