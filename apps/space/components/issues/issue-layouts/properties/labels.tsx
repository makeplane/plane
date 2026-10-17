/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { LabelsOutline } from "@makeplane/propel/icons";
// plane imports
import { Swatch } from "@makeplane/propel/elements/swatch";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { ReadOnlyProperty } from "./read-only-property";

type Props = {
  labelIds: string[];
  shouldShowLabel?: boolean;
};

export const IssueBlockLabels = observer(function IssueBlockLabels({ labelIds, shouldShowLabel = false }: Props) {
  const { getLabelsByIds } = useLabel();

  const labels = getLabelsByIds(labelIds);

  const labelsString = labels.length > 0 ? labels.map((label) => label.name).join(", ") : "No Labels";

  if (labels.length <= 0)
    return (
      <ReadOnlyProperty icon={LabelsOutline} label={shouldShowLabel ? "No Labels" : undefined} tooltip="Labels: None" />
    );

  return (
    <div className="flex h-6 max-w-full items-center gap-1 overflow-hidden">
      {labels.length <= 2 ? (
        <>
          {labels.map((label) => (
            <ReadOnlyProperty
              key={label.id}
              icon={<Swatch fill={label.color ?? "#000000"} />}
              label={label.name}
              tooltip={`Labels: ${label.name}`}
            />
          ))}
        </>
      ) : (
        <ReadOnlyProperty icon={LabelsOutline} label={`${labels.length} Labels`} tooltip={`Labels: ${labelsString}`} />
      )}
    </div>
  );
});
