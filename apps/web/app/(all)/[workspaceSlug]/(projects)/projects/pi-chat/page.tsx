"use client";
import { observer } from "mobx-react";
import { PiChatDetail } from "@/plane-web/components/pi-chat/detail";
import { useEffect } from "react";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

const NewChatPage = observer(() => {
  // store hooks
  const { initPiChat } = usePiChat();

  useEffect(() => {
    initPiChat();
  }, []);
  return <PiChatDetail isFullScreen isProjectLevel />;
});
export default NewChatPage;
