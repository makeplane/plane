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

import type { ThreadSummary } from "../types";
import { DotSeparator } from "../../utils/dot-separator";

type CommentThreadSummaryProps = {
  summary: ThreadSummary;
};

export function CommentThreadSummary(props: CommentThreadSummaryProps) {
  const { summary } = props;

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-2">
        {/* Overlapping avatar group */}
        <div className="flex items-center">
          {summary.avatars.map((avatar, index) => (
            <div
              key={index}
              className={`flex size-4 shrink-0 items-center justify-center overflow-clip rounded-full border border-inverse ${index > 0 ? "-ml-1.5" : ""}`}
            >
              {avatar}
            </div>
          ))}
        </div>
        <span className="text-caption-sm-medium text-secondary">
          {summary.replyCount} {summary.replyCount === 1 ? "reply" : "replies"}
        </span>
        <DotSeparator />
        <span className="text-caption-sm-regular text-tertiary">Last reply {summary.lastReplyTime}</span>
      </div>
    </div>
  );
}
