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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Layers } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import { useModule } from "@/hooks/store/use-module";

export type TReadonlyModuleProps = {
  className?: string;
  hideIcon?: boolean;
  value: string | string[] | null;
  placeholder?: string;
  projectId: string | undefined;
  multiple?: boolean;
  showCount?: boolean;
  workspaceSlug: string;
};

export const ReadonlyModule = observer(function ReadonlyModule(props: TReadonlyModuleProps) {
  const {
    className,
    hideIcon = false,
    value,
    placeholder,
    multiple = false,
    showCount = true,
    workspaceSlug,
    projectId,
  } = props;

  const { t } = useTranslation();
  const { getModuleById, fetchModules } = useModule();

  const moduleIds = Array.isArray(value) ? value : value ? [value] : [];
  const modules = moduleIds.map((id) => getModuleById(id)).filter(Boolean);

  useEffect(() => {
    if (moduleIds.length > 0 && projectId) {
      void fetchModules(workspaceSlug, projectId);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [value, projectId, workspaceSlug, fetchModules]);

  if (modules.length === 0) {
    return (
      <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        {!hideIcon && <Layers className="size-4 flex-shrink-0" />}
        <span className="flex-grow truncate">{placeholder ?? t("common.none")}</span>
      </div>
    );
  }

  if (multiple) {
    const displayText =
      showCount && modules.length > 1 ? `${modules[0]?.name} +${modules.length - 1}` : modules[0]?.name;

    return (
      <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        {!hideIcon && <Layers className="size-4 flex-shrink-0" />}
        <span className="flex-grow truncate">{displayText}</span>
      </div>
    );
  }

  const moduleItem = modules[0];
  return (
    <div className={cn("flex items-center gap-2 text-body-xs-regular", className)}>
      {!hideIcon && <Layers className="size-4 flex-shrink-0" />}
      <span className="flex-grow truncate">{moduleItem?.name}</span>
    </div>
  );
});
