/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TCopilotMessage } from "@plane/types";
// local imports
import { MessageItem } from "./message-item";

type Props = {
  messages: TCopilotMessage[];
};

export const MessageList = observer(function MessageList(props: Props) {
  const { messages } = props;
  const { t } = useTranslation();

  return (
    <div className="vertical-scrollbar flex h-full w-full flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {messages.length === 0 && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
          <span className="text-sm font-medium text-primary">{t("copilot.empty_state.title")}</span>
          <span className="text-sm text-secondary">{t("copilot.empty_state.description")}</span>
        </div>
      )}
    </div>
  );
});
