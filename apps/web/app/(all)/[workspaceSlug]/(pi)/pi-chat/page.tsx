"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";

import { PageHead } from "@/components/core/page-title";
import { PiChatDetail } from "@/plane-web/components/pi-chat/detail";
import { AllChats } from "@/plane-web/components/pi-chat/list/root";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

const NewChatPage = observer(() => {
  // store hooks
  const { initPiChat } = usePiChat();

  useEffect(() => {
    initPiChat();
  }, []);
  return (
    <>
      <PageHead title="Plane AI" />
      <PiChatDetail isFullScreen />
    </>
  );
});

export default NewChatPage;
