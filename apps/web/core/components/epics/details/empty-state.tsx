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
// assets
import emptyIssue from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TEpicEmptyStateProps = {
  workspaceSlug: string;
  projectId: string;
};

export function EpicEmptyState(props: TEpicEmptyStateProps) {
  const { workspaceSlug, projectId } = props;
  const router = useAppRouter();
  return (
    <EmptyState
      image={emptyIssue}
      title="Epic does not exist"
      description="The epic you are looking for does not exist, has been archived, or has been deleted."
      primaryButton={{
        text: "View other epics",
        onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/epics`),
      }}
    />
  );
}
