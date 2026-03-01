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

import { useCallback } from "react";
// custom events
import { ChatSupportEvent } from "@/custom-events/chat-support";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";

export interface IUseChatSupport {
  openChatSupport: () => void;
  isEnabled: boolean;
}

export const useChatSupport = (): IUseChatSupport => {
  const { data: user } = useUser();
  const { config } = useInstance();
  // derived values
  const isEnabled = Boolean(user && config?.is_chat_support_enabled && config?.chat_support_app_id);

  const openChatSupport = useCallback(() => {
    if (!isEnabled) return;
    window.dispatchEvent(new ChatSupportEvent("open"));
  }, [isEnabled]);

  return { openChatSupport, isEnabled };
};
