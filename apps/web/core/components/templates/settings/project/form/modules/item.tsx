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

import { memo } from "react";
// plane imports
import { MODULE_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ModuleStatusIcon } from "@plane/propel/icons";
import type { TProjectModuleBlueprint } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";

type TTemplateModuleItemProps = {
  mod: TProjectModuleBlueprint;
  statusConfig: (typeof MODULE_STATUS)[number] | undefined;
  onEdit: (mod: TProjectModuleBlueprint) => void;
  onDelete: (moduleId: string) => void;
};

export const TemplateModuleItem = memo(function TemplateModuleItem(props: TTemplateModuleItemProps) {
  const { mod, statusConfig, onEdit, onDelete } = props;
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center pl-5 cursor-pointer hover:bg-surface-2 transition-colors"
      role="button"
      tabIndex={0}
      onClick={() => onEdit(mod)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(mod);
        }
      }}
    >
      <div className="flex flex-1 items-center gap-1.5 py-2 min-w-0">
        <span className="flex-1 text-14 font-medium text-primary truncate">{mod.name}</span>
        <div className="flex items-center gap-3 shrink-0">
          {/* Status */}
          {statusConfig && (
            <div className="flex items-center gap-1 h-6 px-2 rounded-md">
              <ModuleStatusIcon status={mod.status} className="size-4" />
              <span className="text-13 font-medium text-secondary">{t(statusConfig.i18n_label)}</span>
            </div>
          )}
          {/* Lead avatar */}
          {mod.lead_id && <ButtonAvatars showTooltip userIds={mod.lead_id} size={20} />}
          {/* Member avatars */}
          {mod.member_ids && mod.member_ids.length > 0 && (
            <ButtonAvatars showTooltip userIds={mod.member_ids} size={20} />
          )}
          {/* Three-dot menu */}
          <CustomMenu ellipsis placement="bottom-end">
            <CustomMenu.MenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(mod);
              }}
            >
              {t("common.edit")}
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(mod.id);
              }}
            >
              {t("common.delete")}
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </div>
  );
});
