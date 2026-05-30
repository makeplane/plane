/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact, EmptyStateDetailed } from "@plane/propel/empty-state";
import { Spinner } from "@plane/ui";

// Centered spinner for article/category fetches.
export const HelpLoading = () => (
  <div className="flex h-40 w-full items-center justify-center">
    <Spinner />
  </div>
);

// Inline empty state for "no categories / no articles yet".
export const HelpCenterEmpty = ({ title }: { title: string }) => <EmptyStateCompact title={title} />;

// Full-page state for an article that has no usable translation in any locale.
export const HelpContentUnavailable = () => {
  const { t } = useTranslation();
  return <EmptyStateDetailed title={t("help_center.content_unavailable")} align="center" />;
};

// Full-page state when a deep link points to a missing / unpublished article.
export const HelpArticleMissing = ({ workspaceSlug }: { workspaceSlug: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center py-10">
      <EmptyStateDetailed
        title={t("help_center.content_unavailable")}
        align="center"
        customButton={
          <Link to={`/${workspaceSlug}/help`}>
            <Button variant="primary" size="base">
              {t("help_center.back_to_help")}
            </Button>
          </Link>
        }
      />
    </div>
  );
};
