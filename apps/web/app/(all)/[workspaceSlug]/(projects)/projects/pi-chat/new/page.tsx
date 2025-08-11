"use client";

import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { PageHead } from "@/components/core";
import { useUser } from "@/hooks/store";
import { NewConversation } from "@/plane-web/components/pi-chat/conversation";
import { InputBox } from "@/plane-web/components/pi-chat/input";

const NewChatPage = observer(() => {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <>
      <PageHead title="Pi Chat" />
      <div className="relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
        <div className={cn("flex-1 my-auto flex flex-co h-full mx-6 relative")}>
          <NewConversation currentUser={currentUser} isFullScreen isProjectLevel />
          {/* Chat Input */}
          <InputBox isProjectLevel isFullScreen />
        </div>
      </div>
    </>
  );
});

export default NewChatPage;
