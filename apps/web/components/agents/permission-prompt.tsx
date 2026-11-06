/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import { ShieldOutline } from "@makeplane/propel/icons";
import type { PendingPermission } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
// local imports
import { permissionOptionLabel } from "./helpers";

const BUTTON_VARIANTS = {
  allow_once: "primary",
  allow_always: "secondary",
  reject_once: "danger-outline",
  reject_always: "danger-outline",
} as const;

type Props = {
  permission: PendingPermission;
  onRespond: (permissionId: string, optionId: string | null) => void;
};

/** The agent asks before running a tool; the turn waits until the member answers. */
export function PermissionPrompt({ permission, onRespond }: Props) {
  const { t } = useTranslation();
  const headingId = `${permission.id}-title`;
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-md border border-strong bg-layer-1 p-3"
    >
      <div className="flex items-center gap-2">
        <ShieldOutline className="size-4 flex-shrink-0 text-accent-primary" />
        <p id={headingId} className="text-body-xs-medium text-primary">
          {t("agents.permission_prompt.title")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {permission.options.map((option) => (
          <Button
            key={option.optionId}
            variant={BUTTON_VARIANTS[option.kind as keyof typeof BUTTON_VARIANTS] ?? "secondary"}
            size="sm"
            stretch="auto"
            label={permissionOptionLabel(t, option)}
            onClick={() => onRespond(permission.id, option.optionId)}
          />
        ))}
      </div>
    </div>
  );
}
