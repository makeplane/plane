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
// utils
import { cn } from "@plane/utils";
// store
import { useMentions } from "@/hooks/store";

type Props = {
  id: string;
  currentUserId: string;
};

export const EditorUserMention: React.FC<Props> = observer((props) => {
  const { id, currentUserId } = props;
  // store
  const { getMemberById, getIsMembersFetched } = useMentions();
  // derived values
  const userDetails = getMemberById(id);
  const isMembersFetched = getIsMembersFetched();

  // Show loading state only if we don't have userDetails and haven't fetched yet
  if (!userDetails && !isMembersFetched) return null;

  if (!userDetails) {
    return (
      <div className="not-prose inline px-1 py-0.5 rounded bg-custom-background-80 text-custom-text-300 no-underline">
        @deactivated user
      </div>
    );
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={cn(
        "not-prose inline px-1 py-0.5 rounded bg-custom-primary-100/20 text-custom-primary-100 no-underline",
        {
          "bg-yellow-500/20 text-yellow-500": id === currentUserId,
        }
      )}
      onTouchStart={(e) => {
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => {
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      @{userDetails?.displayName}
    </div>
  );
});
