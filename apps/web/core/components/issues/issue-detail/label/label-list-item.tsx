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
import { Button } from "@plane/propel/button";
import { CloseIcon, LabelFilledIcon } from "@plane/propel/icons";
// types
import { useLabel } from "@/hooks/store/use-label";
import type { TLabelOperations } from "./root";

type TLabelListItem = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelId: string;
  values: string[];
  labelOperations: TLabelOperations;
  disabled: boolean;
};

export const LabelListItem = observer(function LabelListItem(props: TLabelListItem) {
  const { workspaceSlug, projectId, issueId, labelId, values, labelOperations, disabled } = props;
  // hooks
  const { getLabelById } = useLabel();

  const label = getLabelById(labelId);

  const handleLabel = async () => {
    if (values && !disabled) {
      const currentLabels = values.filter((_labelId) => _labelId !== labelId);
      await labelOperations.updateIssue(workspaceSlug, projectId, issueId, {
        label_ids: currentLabels,
      });
    }
  };

  if (!label) return <></>;
  return (
    <Button variant="tertiary" size="sm" key={labelId} onClick={handleLabel} disabled={disabled} className="truncate">
      <LabelFilledIcon className="size-3 shrink-0" color={label.color ?? "#000000"} />
      <span className="text-body-xs-regular truncate">{label.name}</span>
      {!disabled && <CloseIcon className="transition-all h-2.5 w-2.5 group-hover:text-danger-primary shrink-0" />}
    </Button>
  );
});
