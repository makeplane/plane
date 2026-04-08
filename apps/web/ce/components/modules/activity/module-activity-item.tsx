/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Avatar } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import type { IModuleActivity } from "@plane/types";

type Props = { activity: IModuleActivity };

function getActionText(activity: IModuleActivity, t: (key: string, opts?: Record<string, string>) => string): string {
  const { verb, field, old_value, new_value } = activity;
  if (verb === "created") return t("module.activity.created_module");
  if (verb === "deleted") return t("module.activity.deleted_module");
  if (verb === "archived") return t("module.activity.archived_module");
  if (verb === "unarchived") return t("module.activity.unarchived_module");
  if (verb === "updated") {
    if (field === "name") return t("module.activity.changed_name", { old: old_value ?? "", new: new_value ?? "" });
    if (field === "status") return t("module.activity.changed_status", { old: old_value ?? "", new: new_value ?? "" });
    if (field === "start_date" || field === "target_date")
      return t("module.activity.changed_date", { field: field ?? "" });
    if (field === "lead_id") return t("module.activity.changed_lead");
    if (field === "description") return t("module.activity.changed_description");
    if (field === "work_items") return t("module.activity.updated_work_items");
    if (field === "members") return t("module.activity.updated_members");
    return t("module.activity.updated_module", { field: field ?? "" });
  }
  return t("module.activity.updated_module", { field: field ?? "" });
}

export const ModuleActivityItem = ({ activity }: Props) => {
  const { t } = useTranslation();
  const actor = activity.actor_detail;
  const displayName = actor
    ? actor.display_name || `${actor.first_name} ${actor.last_name}`.trim()
    : t("module.activity.unknown_actor");
  const avatarUrl = actor?.avatar_url ? getFileURL(actor.avatar_url) : undefined;

  return (
    <div className="flex items-start gap-2 py-1.5">
      <Avatar
        name={displayName}
        src={avatarUrl}
        size="sm"
        className="text-11 grid h-full w-full place-items-center rounded-full"
      />
      <div className="flex-1 min-w-0 text-sm text-12">
        <span className="font-medium text-primary">{displayName}</span> <span>{getActionText(activity, t)}</span>
        <span className="ml-1.5 text-xs text-tertiary whitespace-nowrap">{calculateTimeAgo(activity.created_at)}</span>
      </div>
    </div>
  );
};
