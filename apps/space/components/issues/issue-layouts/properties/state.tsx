/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane ui
import { StateGroupIcon } from "@plane/blocks/icons";
import type { TStateGroups } from "@plane/types";
//hooks
import { useStates } from "@/hooks/store/use-state";
import { ReadOnlyProperty } from "./read-only-property";

type Props = {
  shouldShowBorder?: boolean;
} & (
  | {
      stateDetails: {
        name: string;
        group: TStateGroups;
      };
    }
  | {
      stateId: string;
    }
);

export const IssueBlockState = observer(function IssueBlockState(props: Props) {
  const { shouldShowBorder = true } = props;
  // store hooks
  const { getStateById } = useStates();
  // derived values
  const state = "stateId" in props ? getStateById(props.stateId) : props.stateDetails;
  if (!state) return null;

  return (
    <ReadOnlyProperty
      icon={<StateGroupIcon stateGroup={state.group} />}
      label={state.name}
      tooltip={`State: ${state.name}`}
      shouldShowBorder={shouldShowBorder}
    />
  );
});
