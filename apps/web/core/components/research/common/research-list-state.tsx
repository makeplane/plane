/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Spinner } from "@plane/ui";

type Props = {
  kind: "loading" | "error" | "empty" | "no-results";
  resource: "projects" | "reports";
  onRetry?: () => void;
  onClearFilters?: () => void;
  createHref?: string;
};

/** Consistent loading, error and empty state for research data lists. */
export function ResearchListState({ kind, resource, onRetry, onClearFilters, createHref }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-subtle p-6 text-center"
      role={kind === "error" ? "alert" : "status"}
      aria-busy={kind === "loading"}
    >
      {kind === "loading" && <Spinner />}
      <h3 className="mt-2 text-13 font-medium text-primary">{t(`research.list_state.${resource}.${kind}.title`)}</h3>
      <p className="mt-1 max-w-md text-12 text-tertiary">{t(`research.list_state.${resource}.${kind}.description`)}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {kind === "error" && onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t("research.status.retry")}
          </Button>
        )}
        {kind === "no-results" && onClearFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters}>
            {t("research.list_state.clear_filters")}
          </Button>
        )}
        {kind === "empty" && createHref && (
          <Link href={createHref} className="rounded-md bg-accent-primary px-3 py-1.5 text-12 text-on-color">
            {t(`research.list_state.${resource}.create`)}
          </Link>
        )}
      </div>
    </div>
  );
}
