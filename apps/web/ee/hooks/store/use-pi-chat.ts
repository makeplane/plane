import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
import { IPiChatStore } from "@/plane-web/store/pi-chat/pi-chat";
// plane web stores

export const usePiChat = (): IPiChatStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePiChat must be used within StoreProvider");
  return context.piChat;
};
