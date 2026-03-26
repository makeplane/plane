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

import type { ReactNode } from "react";
import { DotSeparator } from "../../utils/dot-separator";

type CommentHeaderProps = {
  authorName: string;
  action?: string;
  timestamp: string;
  visibilityIcon?: ReactNode;
  isEdited?: boolean;
  actionsElement?: ReactNode;
};

export function CommentHeader(props: CommentHeaderProps) {
  const { authorName, action = "commented", timestamp, visibilityIcon, isEdited, actionsElement } = props;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-body-xs-medium text-primary whitespace-nowrap">{authorName}</span>
        <span className="text-body-xs-regular text-tertiary whitespace-nowrap">{action}</span>
      </div>
      {timestamp && (
        <>
          <DotSeparator />
          <span className="text-caption-sm-regular text-tertiary whitespace-nowrap">{timestamp}</span>
        </>
      )}
      {isEdited && <span className="text-caption-sm-regular text-tertiary">(edited)</span>}
      {visibilityIcon && (
        <>
          <DotSeparator />
          <span className="flex size-3.5 shrink-0 items-center justify-center">{visibilityIcon}</span>
        </>
      )}
      {actionsElement && <div className="ml-auto shrink-0">{actionsElement}</div>}
    </div>
  );
}
