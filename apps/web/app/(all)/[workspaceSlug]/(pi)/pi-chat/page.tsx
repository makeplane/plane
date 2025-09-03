"use client";

import { observer } from "mobx-react";
import { cn } from "@plane/utils";

import { PiChatDetail } from "@/plane-web/components/pi-chat/detail";
import { useEffect } from "react";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { PageHead } from "@/components/core/page-title";
import { AllChats } from "@/plane-web/components/pi-chat/list/root";

const NewChatPage = observer(() => {
  // store hooks
  const { initPiChat } = usePiChat();

  useEffect(() => {
    initPiChat();
  }, []);
  return (
    <>
      <PageHead title="Pi Chat" />
      <PiChatDetail isFullScreen />
    </>
  );
});

export default NewChatPage;
