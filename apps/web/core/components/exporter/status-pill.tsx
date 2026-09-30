/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

const STATUS_CLASSES: Record<string, string> = {
  completed: "bg-success-subtle text-success-primary",
  processing: "bg-yellow-500/20 text-yellow-500",
  failed: "bg-danger-subtle text-danger-primary",
  expired: "bg-orange-500/20 text-orange-500",
};

type Props = {
  status: string;
};

export function ImportExportStatusPill(props: Props) {
  const { status } = props;
  const { t } = useTranslation();

  const key = `workspace_settings.settings.exports.statuses.${status}`;
  const label = t(key);
  // t() hands back the key itself when there is no translation, which is how an unexpected
  // status from the API is recognised and shown as-is
  const isTranslated = label !== key;

  return (
    <span
      className={cn("rounded-sm px-2 py-1 text-11", STATUS_CLASSES[status] ?? "bg-gray-500/20 text-gray-500", {
        capitalize: !isTranslated,
      })}
    >
      {isTranslated ? label : status}
    </span>
  );
}
