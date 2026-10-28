/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { redirect } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { IssueService } from "@/services/issue/issue.service";
// types
import type { Route } from "./+types/page";

const issueService = new IssueService();

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { workspaceSlug, projectId, issueId } = params;

  try {
    const data = await issueService.getIssueMetaFromURL(workspaceSlug, projectId, issueId);

    if (data) {
      throw redirect(`/${workspaceSlug}/browse/${data.project_identifier}-${data.sequence_id}`);
    }

    return { error: true, workspaceSlug };
  } catch (error) {
    // If it's a redirect, rethrow it
    if (error instanceof Response) {
      throw error;
    }
    // Otherwise return error state
    return { error: true, workspaceSlug };
  }
}

export default function IssueDetailsPage({ loaderData }: Route.ComponentProps) {
  const router = useAppRouter();
  const { t } = useTranslation();

  if (loaderData.error) {
    return (
      <div className="flex size-full items-center justify-center">
        <EmptyStateDetailed
          align="center"
          assetKey="work-item"
          assetClassName="size-40"
          title={t("issue.empty_state.issue_detail.title")}
          description={t("issue.empty_state.issue_detail.description")}
          actions={[
            {
              label: t("issue.empty_state.issue_detail.primary_button.text"),
              variant: "primary",
              onClick: () => router.push(`/${loaderData.workspaceSlug}/workspace-views/all-issues/`),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex size-full items-center justify-center">
      <LogoSpinner />
    </div>
  );
}
