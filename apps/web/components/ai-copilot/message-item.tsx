/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
import type { TCopilotMessage } from "@plane/types";

type Props = {
  message: TCopilotMessage;
};

export const MessageItem = observer(function MessageItem(props: Props) {
  const { message } = props;
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "text-sm max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-wrap",
          isUser ? "bg-accent-primary text-on-color" : "bg-surface-2 text-primary"
        )}
      >
        {message.content}
      </div>
    </div>
  );
});
