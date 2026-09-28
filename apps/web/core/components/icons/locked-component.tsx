/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LockOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";

export function LockedComponent(props: { toolTipContent?: string }) {
  const { toolTipContent } = props;
  const lockedComponent = (
    <div className="flex h-7 flex-shrink-0 items-center gap-2 rounded-full bg-layer-1 px-3 py-0.5 text-11 font-medium text-tertiary">
      <LockOutline className="h-3 w-3" />
      <span>Locked</span>
    </div>
  );

  return (
    <>
      {toolTipContent ? (
        <Tooltip label={toolTipContent} layout="stacked">
          {lockedComponent}
        </Tooltip>
      ) : (
        <>{lockedComponent}</>
      )}
    </>
  );
}
