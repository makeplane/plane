/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
  const isEnabled = Boolean(user && config?.is_intercom_enabled && config?.intercom_app_id);

  const openChatSupport = useCallback(() => {
    if (!isEnabled) return;
    window.dispatchEvent(new ChatSupportEvent("open"));
  }, [isEnabled]);

  return { openChatSupport, isEnabled };
};
