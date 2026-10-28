/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

// icons
import { PriorityIcon } from "@plane/blocks/icons";
import type { TIssuePriorities } from "@plane/types";
import { RemovableChip } from "@/components/common/removable-chip";
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedPriorityFilters = observer(function AppliedPriorityFilters(props: Props) {
  const { handleRemove, values, editable } = props;

  return (
    <>
      {values.map((priority) => (
        <RemovableChip
          key={priority}
          variant="soft"
          icon={<PriorityIcon priority={priority as TIssuePriorities} className="h-3 w-3" />}
          label={priority}
          ariaLabel={priority}
          onRemove={editable ? () => handleRemove(priority) : undefined}
        />
      ))}
    </>
  );
});
