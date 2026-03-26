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

import { ExternalLink } from "lucide-react";
import type { CommentSource } from "../types";
import { DotSeparator } from "../../utils/dot-separator";

type CommentSourceHeaderProps = {
  source: CommentSource;
  timestamp: string;
};

export function CommentSourceHeader(props: CommentSourceHeaderProps) {
  const { source, timestamp } = props;

  return (
    <div className="flex items-center gap-3 px-3 pb-1.5 pt-3">
      <span className="flex size-4 shrink-0 items-center justify-center">{source.icon}</span>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-body-xs-medium text-secondary"
        >
          {source.label}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        <span className="text-body-xs-medium text-secondary">{source.label}</span>
      )}
      <DotSeparator />
      <span className="text-caption-sm-regular text-tertiary">{timestamp}</span>
    </div>
  );
}
