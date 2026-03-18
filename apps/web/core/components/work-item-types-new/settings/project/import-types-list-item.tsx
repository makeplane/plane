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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import { Checkbox } from "@plane/ui";
// local imports
import { IssueTypeLogo } from "../common/issue-type-logo";

type ImportTypesListItemProps = {
  workItemType: BaseWorkItemTypeInstanceSchema;
  isSelected: boolean;
  onToggle: (typeId: string) => void;
};

export const ImportTypesListItem = observer(function ImportTypesListItem(props: ImportTypesListItemProps) {
  const { workItemType, isSelected, onToggle } = props;
  // hooks
  const { t } = useTranslation();
  // derived values
  const detail = workItemType.asJSON;

  if (!detail) return null;

  return (
    <button
      className="flex w-full items-center gap-3 rounded-lg border border-subtle p-3 transition-colors cursor-pointer hover:bg-layer-2-hover"
      onClick={() => onToggle(workItemType.id)}
    >
      <Checkbox checked={isSelected} className="shrink-0" />
      <IssueTypeLogo icon_props={detail.logo_props?.icon} size="xl" isDefault={detail.is_default} />
      <div className="flex flex-col items-start justify-start min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-body-sm-medium text-primary line-clamp-1">{detail.name}</span>
          {detail.is_global && (
            <div className="shrink-0 py-0.5 px-2 text-caption-sm-medium rounded-sm text-accent-primary bg-transparent border border-accent-strong cursor-default">
              {t("common.global")}
            </div>
          )}
        </div>
        {detail.description && (
          <span className="text-body-xs-regular text-tertiary line-clamp-1">{detail.description}</span>
        )}
      </div>
    </button>
  );
});
