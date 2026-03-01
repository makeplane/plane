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
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import emptyIssue from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TInitiativeEmptyStateProps = {
  workspaceSlug: string;
};

export function InitiativeEmptyState(props: TInitiativeEmptyStateProps) {
  const { workspaceSlug } = props;
  // router
  const router = useAppRouter();

  const { t } = useTranslation();

  return (
    <EmptyState
      image={emptyIssue}
      title={t("initiatives.empty_state.not_found.title")}
      description={t("initiatives.empty_state.not_found.description")}
      primaryButton={{
        text: t("initiatives.empty_state.not_found.primary_button.text"),
        onClick: () => router.push(`/${workspaceSlug}/initiatives/`),
      }}
    />
  );
}
