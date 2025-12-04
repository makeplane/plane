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
