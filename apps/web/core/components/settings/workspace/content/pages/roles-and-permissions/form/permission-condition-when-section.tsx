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

// plane imports
import type { PermissionMatrixRow } from "@plane/constants";
import { getConditionSentenceLabel } from "@plane/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { AccordionCloseIcon, AccordionOpenIcon } from "@plane/propel/icons";
import type { PermissionCondition } from "@plane/types";
import { cn, sanitizeConditionsForRow } from "@plane/utils";

type Props = {
  row: PermissionMatrixRow;
  selectedConditions: PermissionCondition[];
  onConditionsChange: (conditions: PermissionCondition[]) => void;
  t: (key: string) => string;
};

const NO_CONDITION_LABELS: Record<PermissionMatrixRow["namespace"], string> = {
  workspace: "User is part of the workspace",
  project: "User is part of the project",
};

export function PermissionConditionWhenSection(props: Props) {
  const { row, selectedConditions, onConditionsChange, t } = props;
  // derived values
  const activeCondition = sanitizeConditionsForRow(selectedConditions, row)[0] ?? null;
  const noConditionLabel = NO_CONDITION_LABELS[row.namespace];
  const radioName = `condition-${row.rowId}`;

  return (
    <Collapsible defaultOpen className="mt-2 ml-6">
      <div className="rounded-lg bg-layer-1 p-3">
        <CollapsibleTrigger className="group flex w-full items-center gap-0.5! text-caption-md-semibold text-tertiary hover:text-secondary">
          <span>When</span>
          <AccordionCloseIcon className="size-4 shrink-0 transition-transform block group-data-panel-open:hidden" />
          <AccordionOpenIcon className="size-4 shrink-0 transition-transform hidden group-data-panel-open:block" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div role="radiogroup" aria-label={`Condition for ${t(row.labelKey)}`} className="mt-2 flex flex-col gap-1.5">
            {/* No additional condition radio */}
            <ConditionRadioOption
              name={radioName}
              checked={activeCondition === null}
              onChange={() => onConditionsChange([])}
              label={noConditionLabel}
            />
            {/* One radio per available condition */}
            {row.conditions.map((condition) => (
              <ConditionRadioOption
                key={condition}
                name={radioName}
                checked={activeCondition === condition}
                onChange={() => onConditionsChange([condition])}
                label={`User is ${getConditionSentenceLabel(condition)}`}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

type ConditionRadioOptionProps = {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
};

const ConditionRadioOption = ({ name, checked, onChange, label }: ConditionRadioOptionProps) => {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className={cn(
          "size-3.5 shrink-0 cursor-pointer rounded-full border border-strong-1 bg-layer-2",
          checked && "bg-accent-primary/80 border-accent-strong"
        )}
      />
      <span className="text-body-xs-regular text-primary">{label}</span>
    </label>
  );
};
