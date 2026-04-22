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

import React from "react";
import { useTheme } from "@plane/react-theme";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import darkIssuesAsset from "@/app/assets/empty-state/search/issues-dark.webp?url";
import lightIssuesAsset from "@/app/assets/empty-state/search/issues-light.webp?url";
import darkSearchAsset from "@/app/assets/empty-state/search/search-dark.webp?url";
import lightSearchAsset from "@/app/assets/empty-state/search/search-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";

type EmptyStateProps = {
  resultCount: number;
  searchTerm: string;
  isSearching: boolean;
};

function EmptyStateContainer({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-3 py-8 text-center">{children}</div>;
}

export function IssueSearchModalEmptyState({ resultCount, searchTerm, isSearching }: EmptyStateProps) {
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const searchResolvedPath = resolvedTheme === "light" ? lightSearchAsset : darkSearchAsset;
  const issuesResolvedPath = resolvedTheme === "light" ? lightIssuesAsset : darkIssuesAsset;

  if (resultCount === 0 && searchTerm !== "" && !isSearching) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("issue_relation.empty_state.no_issues.title")} assetPath={issuesResolvedPath} />
      </EmptyStateContainer>
    );
  } else if (resultCount === 0) {
    return (
      <EmptyStateContainer>
        <SimpleEmptyState title={t("issue_relation.empty_state.search.title")} assetPath={searchResolvedPath} />
      </EmptyStateContainer>
    );
  }
  return null;
}
