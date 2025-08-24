"use client";

import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useUser } from "@/hooks/store/user/user-user";
// plane web imports
import { NewConversation } from "@/plane-web/components/pi-chat/conversation/new-converstaion";
import { InputBox } from "@/plane-web/components/pi-chat/input";

const NewChatPage = observer(() => {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <>
      <PageHead title="Pi Chat" />
      <div className="relative flex flex-col h-full flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
        <div className={cn("flex-1 my-auto flex flex-co h-full mx-6 relative")}>
          <NewConversation currentUser={currentUser} isFullScreen />
          {/* Chat Input */}
          <InputBox isFullScreen />
        </div>
      </div>
    </>
  );
});

export default NewChatPage;
