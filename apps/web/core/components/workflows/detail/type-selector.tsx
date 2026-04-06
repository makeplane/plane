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
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueTypes } from "@/plane-web/hooks/store";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { getButtonStyling } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { CheckIcon } from "@plane/propel/icons";
import { observer } from "mobx-react";
import { useMemo } from "react";

type Props = {
  selectedTypeIds: string[];
  projectId: string;
  handleChange: (value: string[]) => void;
  workflowId?: string;
};

export const WorkItemTypeMultiSelect = observer(function WorkItemTypeMultiSelect(props: Props) {
  // props
  const { selectedTypeIds, projectId, handleChange, workflowId } = props;

  // hooks
  const { getIssueTypeById } = useIssueTypes();
  const { getUnassignedWorkItemTypeIds } = useWorkflows();

  // derived values
  const availableWorkItemTypeIds = getUnassignedWorkItemTypeIds(projectId, workflowId);
  const workItemTypeOptions: { value: string; label: string }[] = useMemo(() => {
    return availableWorkItemTypeIds
      .map((id) => {
        const workItemType = getIssueTypeById(id);
        if (!workItemType || !workItemType.name) return null;
        return {
          value: id,
          label: workItemType.name,
        };
      })
      .filter((option) => option !== null);
  }, [availableWorkItemTypeIds, getIssueTypeById]);

  const TypeLabel = ({ id, label }: { id: string; label: string }) => {
    return (
      <div className="flex items-center gap-2">
        <IssueTypeIdentifier issueTypeId={id} size="xs" />
        <span className="text-caption-md-regular">{label}</span>
      </div>
    );
  };

  return (
    <Combobox multiSelect value={selectedTypeIds} onValueChange={(v) => handleChange(v as string[])}>
      <Combobox.Chips
        className="border border-subtle bg-layer-2 rounded-md px-2 py-1"
        getLabel={(val) => workItemTypeOptions.find((f) => f.value === val)?.label || val}
        renderChip={(value, label) => (
          <Combobox.Chip value={value} className={getButtonStyling("secondary", "base")}>
            <TypeLabel id={value} label={label} />
          </Combobox.Chip>
        )}
      >
        <p className="text-body-xs-regular text-placeholder text-left">Select types</p>
      </Combobox.Chips>
      <Combobox.Options showSearch searchPlaceholder="Search types" className="w-72" positionerClassName="z-31">
        {workItemTypeOptions.map((workItemType) => (
          <Combobox.Option
            key={workItemType.value}
            value={workItemType.value}
            className="flex items-center justify-between gap-2 px-4 py-2"
          >
            <TypeLabel id={workItemType.value} label={workItemType.label} />
            {selectedTypeIds.includes(workItemType.value) && <CheckIcon className="h-4 w-4" />}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
});
