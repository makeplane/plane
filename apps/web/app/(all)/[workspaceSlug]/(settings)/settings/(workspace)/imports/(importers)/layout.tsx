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

import { observer } from "mobx-react";
import Link from "next/link";
import { Outlet } from "react-router";
import { SILO_BASE_URL, SILO_BASE_PATH } from "@plane/constants";
import { ChevronLeftIcon } from "@plane/propel/icons";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/layout";

function ImporterLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();
  // derived values
  const siloBaseUrl = encodeURI(SILO_BASE_URL + SILO_BASE_PATH) || undefined;
  const workspaceId = currentWorkspace?.id || undefined;
  const userId = currentUser?.id || undefined;

  // check if workspace exists
  if (!workspaceId || !userId || !siloBaseUrl) return null;

  return (
    <SettingsContentWrapper hugging>
      <Link
        href={`/${workspaceSlug}/settings/imports`}
        className="flex items-center gap-2 text-13 text-tertiary font-semibold pb-4"
      >
        <ChevronLeftIcon className="size-4" />
        <span>Back to Imports</span>
      </Link>
      <Outlet />
    </SettingsContentWrapper>
  );
}

export default observer(ImporterLayout);
