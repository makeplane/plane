/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";

// icons
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/blocks/icons";
import type { TStateGroups } from "@plane/types";
import { RemovableChip } from "@/components/common/removable-chip";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedStateGroupFilters = observer(function AppliedStateGroupFilters(props: Props) {
  const { handleRemove, values } = props;

  return (
    <>
      {values.map((stateGroup) => (
        <RemovableChip
          key={stateGroup}
          variant="soft"
          icon={<StateGroupIcon stateGroup={stateGroup as TStateGroups} size={EIconSize.SM} />}
          label={stateGroup}
          ariaLabel={stateGroup}
          onRemove={() => handleRemove(stateGroup)}
        />
      ))}
    </>
  );
});
