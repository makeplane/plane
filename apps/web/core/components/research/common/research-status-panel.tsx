/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

export type TResearchStatus =
  | "load_failed"
  | "module_disabled"
  | "workspace_disabled"
  | "section_disabled"
  | "permission_denied";

type Props = {
  status: TResearchStatus;
  workspaceSlug: string;
  workspaceName?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
};

/** Shared explanatory state for research access and availability failures. */
export function ResearchStatusPanel({ status, workspaceSlug, workspaceName, onRetry, isRetrying = false }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-64 w-full items-center justify-center p-5">
      <section
        className="w-full max-w-xl rounded-lg border border-subtle bg-surface-1 p-6 text-center"
        role={status === "load_failed" ? "alert" : "status"}
      >
        <h1 className="text-16 font-medium text-primary">{t(`research.status.${status}.title`)}</h1>
        <p className="mt-2 text-13 text-secondary">{t(`research.status.${status}.description`)}</p>
        <p className="mt-3 text-11 text-tertiary">
          {t("research.status.workspace", { workspace: workspaceName || workspaceSlug })}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button variant="primary" size="sm" loading={isRetrying} disabled={isRetrying} onClick={onRetry}>
              {t("research.status.retry")}
            </Button>
          )}
          <Link
            href={`/${workspaceSlug}/`}
            className="rounded-md border border-strong px-3 py-1.5 text-12 text-secondary hover:bg-surface-2"
          >
            {t("research.status.back_to_workspace")}
          </Link>
        </div>
      </section>
    </div>
  );
}
