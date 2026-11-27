/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the decision register page in place of the register: no access, turned off, not loaded.

import Link from "next/link";
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
import { isDisabledError, isForbiddenError } from "./decisions.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export type TUnavailableReason = "no_access" | "disabled" | "error";

type UnavailableProps = Props & { reason: TUnavailableReason; isAdmin: boolean; onRetry?: () => void };

/** The page in place of the register: no access, turned off, or not loaded. */
export function DecisionsUnavailable(props: UnavailableProps) {
  const { workspaceSlug, projectId, reason, isAdmin, onRetry } = props;
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-16 font-medium text-primary">{t(`liviere.decisions.unavailable.${reason}.title`)}</h2>
      <p className="max-w-md text-13 text-tertiary">{t(`liviere.decisions.unavailable.${reason}.description`)}</p>
      {reason === "disabled" && isAdmin && (
        <Link
          href={`/${workspaceSlug}/settings/projects/${projectId}/features/decisions`}
          className="mt-2 text-13 text-accent-primary hover:underline"
        >
          {t("liviere.decisions.unavailable.open_settings")}
        </Link>
      )}
      {reason === "error" && onRetry && (
        <div className="mt-2">
          <Button variant="secondary" size="md" stretch="auto" label={t("liviere.decisions.retry")} onClick={onRetry} />
        </div>
      )}
    </div>
  );
}

/** The reason a request of the register failed, as a page state; null when it is a passing error. */
export function unavailableReason(error: unknown): TUnavailableReason | null {
  if (!error) return null;
  if (isForbiddenError(error)) return "no_access";
  if (isDisabledError(error)) return "disabled";
  return "error";
}
