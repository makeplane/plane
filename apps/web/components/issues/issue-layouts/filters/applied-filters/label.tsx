/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

// icons
import type { IIssueLabel } from "@plane/types";
import { RemovableChip } from "@/components/common/removable-chip";
// types

type Props = {
  handleRemove: (val: string) => void;
  labels: IIssueLabel[] | undefined;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedLabelsFilters = observer(function AppliedLabelsFilters(props: Props) {
  const { handleRemove, labels, values, editable } = props;

  return (
    <>
      {values.map((labelId) => {
        const labelDetails = labels?.find((l) => l.id === labelId);

        if (!labelDetails) return null;

        return (
          <RemovableChip
            key={labelId}
            variant="soft"
            icon={<span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: labelDetails.color }} />}
            label={labelDetails.name}
            ariaLabel={labelDetails.name}
            onRemove={editable ? () => handleRemove(labelId) : undefined}
          />
        );
      })}
    </>
  );
});
