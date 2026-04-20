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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { PermissionMatrixGroup } from "@plane/constants";
import { getConditionClauseLabel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { AccordionCloseIcon } from "@plane/propel/icons";
import type { PermissionGrantString, PermissionScheme } from "@plane/types";
import { cn, permissionsToMatrixState, sanitizeConditionsForRow } from "@plane/utils";
import { Checkbox } from "@plane/ui";

type Props = {
  scheme: PermissionScheme;
  groups: PermissionMatrixGroup[];
};

export const CompactSchemePermissions = observer(function CompactSchemePermissions(props: Props) {
  const { scheme, groups } = props;
  // plane hooks
  const { t } = useTranslation();

  // Compute which permissions are enabled per group
  const { activeGroups, totalPermissions } = useMemo(() => {
    const permissionsRecord = Object.fromEntries(scheme.permissions.map((p) => [p, true as const])) as Partial<
      Record<PermissionGrantString, true>
    >;
    const matrixState = permissionsToMatrixState(permissionsRecord, groups);

    let total = 0;
    const result: Array<{
      key: string;
      title: string;
      permissions: Array<{ rowId: string; label: string; conditionLabel: string | null }>;
    }> = [];

    for (const group of groups) {
      const enabledRows: Array<{ rowId: string; label: string; conditionLabel: string | null }> = [];
      for (const row of group.rows) {
        const selection = matrixState[row.rowId];
        if (selection && selection.mode !== "disabled") {
          const sanitizedConditions =
            selection.mode === "conditional" ? sanitizeConditionsForRow(selection.conditions, row) : [];
          const conditionLabel =
            selection.mode === "conditional" && sanitizedConditions.length > 0
              ? getConditionClauseLabel(sanitizedConditions)
              : null;

          enabledRows.push({ rowId: row.rowId, label: t(row.labelKey), conditionLabel });
          total++;
        }
      }
      if (enabledRows.length > 0) {
        result.push({
          key: group.key,
          title: t(group.titleKey),
          permissions: enabledRows,
        });
      }
    }

    return { activeGroups: result, totalPermissions: total };
  }, [scheme.permissions, groups, t]);

  return (
    <Collapsible className="w-full rounded-lg border border-subtle overflow-hidden">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 bg-layer-2 px-4 py-3 hover:bg-layer-2-hover transition-colors">
        <AccordionCloseIcon
          className={cn(
            "size-3.5 shrink-0 text-tertiary transition-transform duration-200 group-data-panel-open:rotate-90"
          )}
        />
        <span className="flex-1 text-left text-body-sm-medium text-primary">{scheme.name}</span>
        <span className="shrink-0 rounded-sm bg-layer-3 px-1.5 h-5 inline-flex items-center text-caption-sm-medium text-tertiary">
          {totalPermissions} permission{totalPermissions !== 1 ? "s" : ""}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="max-h-96 overflow-y-auto vertical-scrollbar scrollbar-sm bg-layer-1 border-t border-subtle">
        <div className="p-4 space-y-4">
          {activeGroups.map((group, idx) => (
            <div
              key={group.key}
              className={cn("space-y-4", {
                "pb-4 border-b border-subtle": idx < activeGroups.length - 1,
              })}
            >
              <h6 className="text-body-xs-semibold text-tertiary">{group.title}</h6>
              {group.permissions.map((perm) => (
                <div key={perm.rowId} className="flex items-center gap-3">
                  <Checkbox
                    checked
                    disabled
                    containerClassName="shrink-0"
                    className="!bg-[var(--text-color-icon-disabled)]"
                    iconClassName="!text-on-color !opacity-100"
                  />
                  <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                    <span className="text-body-sm-regular text-primary">{perm.label}</span>
                    {perm.conditionLabel && (
                      <span className="text-body-sm-regular text-secondary">{perm.conditionLabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
