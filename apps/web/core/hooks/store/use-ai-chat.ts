import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IAiChatStore } from "@/store/ai-chat.store";

export const useAiChat = (): IAiChatStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAiChat must be used within StoreProvider");
  return context.aiChat;
};
