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

import { useTheme } from "next-themes";
import { redirect } from "react-router";
// assets
import emptyIssueDark from "@/app/assets/empty-state/search/issues-dark.webp?url";
import emptyIssueLight from "@/app/assets/empty-state/search/issues-light.webp?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { EpicService } from "@/services/issue-types";
// types
import type { Route } from "./+types/page";

const epicService = new EpicService();

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { workspaceSlug, projectId, epicId } = params;

  try {
    const data = await epicService.getEpicMetaFromURL(workspaceSlug, projectId, epicId);

    if (data) {
      throw redirect(`/${workspaceSlug}/browse/${data.project_identifier}-${data.sequence_id}`);
    }

    return { error: true, workspaceSlug, projectId };
  } catch (error) {
    // If it's a redirect, rethrow it
    if (error instanceof Response) {
      throw error;
    }
    // Otherwise return error state
    return { error: true, workspaceSlug, projectId };
  }
}

export default function EpicDetailsPage({ loaderData }: Route.ComponentProps) {
  const router = useAppRouter();
  const { resolvedTheme } = useTheme();

  if (loaderData.error) {
    return (
      <div className="flex items-center justify-center size-full">
        <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title="Epic does not exist"
          description="The epic you are looking for does not exist, has been archived, or has been deleted."
          primaryButton={{
            text: "View other epics",
            onClick: () => router.push(`/${loaderData.workspaceSlug}/projects/${loaderData.projectId}/epics`),
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center size-full">
      <LogoSpinner />
    </div>
  );
}
