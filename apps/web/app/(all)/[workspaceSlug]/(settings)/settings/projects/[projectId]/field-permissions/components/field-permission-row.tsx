/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Lock, type LucideIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

type TFieldPermissionRowProps = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  value: boolean;
  disabled: boolean;
  destructive?: boolean;
  onToggle: () => void;
};

export const FieldPermissionRow = observer(function FieldPermissionRow({
  icon: Icon,
  titleKey,
  descriptionKey,
  value,
  disabled,
  destructive = false,
  onToggle,
}: TFieldPermissionRowProps) {
  const { t } = useTranslation();

  const handleRowClick = () => {
    if (disabled) return;
    onToggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  const statusLabel = value
    ? t("project_settings.field_permissions.status.enabled")
    : t("project_settings.field_permissions.status.disabled");

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={value}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-subtle bg-surface-1 px-4 py-4 transition-colors",
        !disabled && "cursor-pointer hover:border-strong hover:bg-layer-1",
        disabled && "opacity-70"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md",
          destructive ? "bg-danger-subtle text-danger-primary" : "bg-accent-subtle text-accent-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold text-primary">{t(titleKey)}</span>
        <span className="text-xs leading-relaxed text-secondary">{t(descriptionKey)}</span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
            value ? "bg-success-subtle text-success-primary" : "bg-surface-2 text-secondary"
          )}
        >
          {!value && (
            <Tooltip tooltipContent={t("project_settings.field_permissions.locked_tooltip")}>
              <Lock className="h-3 w-3" />
            </Tooltip>
          )}
          {statusLabel}
        </span>
        <Switch
          value={value}
          onChange={(next) => {
            if (next !== value) onToggle();
          }}
          disabled={disabled}
          size="lg"
          label={t(titleKey)}
        />
      </div>
    </div>
  );
});
