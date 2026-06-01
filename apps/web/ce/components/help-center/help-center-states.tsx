/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact, EmptyStateDetailed } from "@plane/propel/empty-state";
import { Spinner } from "@plane/ui";

// Centered spinner for article/category fetches. Spinner (not skeleton) matches
// the platform's house loading style.
export const HelpLoading = () => (
  <div className="flex h-40 w-full items-center justify-center">
    <Spinner />
  </div>
);

type EmptyProps = {
  title: string;
  /** Optional supporting line (e.g. a "try different keywords" hint for search). */
  description?: string;
  /** Optional illustration key (e.g. "search" for no search results). */
  assetKey?: "search" | "inbox";
  /** Optional recovery affordance (e.g. a "browse all categories" button). */
  action?: ReactNode;
};

// Inline empty state for "no categories / no articles / no search results".
export const HelpCenterEmpty = ({ title, description, assetKey, action }: EmptyProps) => (
  <EmptyStateCompact title={title} description={description} assetKey={assetKey} customButton={action} />
);

// Inline error state: a failed fetch must not masquerade as an empty result —
// show the cause and a retry instead.
export const HelpCenterError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyStateDetailed
      title={t("help_center.load_error")}
      assetKey="server-error"
      align="center"
      customButton={
        <Button variant="primary" size="base" onClick={onRetry}>
          {t("help_center.retry")}
        </Button>
      }
    />
  );
};

// Full-page state for an article that has no usable translation in any locale.
export const HelpContentUnavailable = () => {
  const { t } = useTranslation();
  return <EmptyStateDetailed title={t("help_center.content_unavailable")} align="center" />;
};

// Full-page state when a deep link points to a missing / unpublished article.
export const HelpArticleMissing = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center py-10">
      <EmptyStateDetailed
        title={t("help_center.content_unavailable")}
        align="center"
        customButton={
          <Link to="/help">
            <Button variant="primary" size="base">
              {t("help_center.back_to_help")}
            </Button>
          </Link>
        }
      />
    </div>
  );
};
