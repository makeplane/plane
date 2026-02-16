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

import { Outlet } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";
// layouts
import { WorkspaceAuthWrapper } from "@/layouts/auth-layout/workspace-wrapper";
// lib
import { redirectIfUserIsNotOnboarded, requireAuthenticatedUser } from "@/lib/middleware/auth-client-middleware";
import { bootstrapWorkspace } from "@/lib/bootstrap/client-bootstrap";
import { WithSocketProviderHOC } from "@/lib/socket/provider/hoc";
// plane web imports
import { WorkspaceContentWrapper } from "@/components/workspace/content-wrapper";
import { AppRailVisibilityProvider } from "@/plane-web/hooks/app-rail";
import { GlobalModals } from "@/components/common/modal/global";
import type { Route } from "./+types/layout";

export const clientMiddleware = [requireAuthenticatedUser, redirectIfUserIsNotOnboarded];

export async function clientLoader(args: Route.ClientLoaderArgs) {
  await bootstrapWorkspace(args.params.workspaceSlug);
  return null;
}
clientLoader.hydrate = true as const;

export function shouldRevalidate({
  currentParams,
  nextParams,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod) return defaultShouldRevalidate;
  return currentParams.workspaceSlug !== nextParams.workspaceSlug;
}

export default function WorkspaceLayout(props: Route.ComponentProps) {
  const { workspaceSlug } = props.params;

  return (
    <WorkspaceAuthWrapper workspaceSlug={workspaceSlug}>
      <WithSocketProviderHOC workspaceSlug={workspaceSlug}>
        <AppRailVisibilityProvider>
          <WorkspaceContentWrapper>
            <GlobalModals workspaceSlug={workspaceSlug} />
            <Outlet />
          </WorkspaceContentWrapper>
        </AppRailVisibilityProvider>
      </WithSocketProviderHOC>
    </WorkspaceAuthWrapper>
  );
}
