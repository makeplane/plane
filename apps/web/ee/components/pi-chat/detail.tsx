"use client";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens";
import { useUser } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Messages } from "./conversation";
import { Loading } from "./conversation/loading";

import { InputBox } from "./input";

type TProps = {
  isFullScreen?: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
};
export const PiChatDetail = observer((props: TProps) => {
  const { isFullScreen: isFullScreenProp = false, shouldRedirect = true, isProjectLevel = false } = props;
  // router
  const pathName = usePathname();
  // store hooks
  const { isAuthorized, isLoading, activeChatId } = usePiChat();
  const { data: currentUser } = useUser();
  // derived values
  const isFullScreen = pathName.includes("pi-chat") || isFullScreenProp;
  return (
    <>
      {isAuthorized ? (
        <div className="px-page-x relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[780px] md:m-auto w-full">
          <div className={cn("flex-1 my-auto flex flex-co h-full relative")}>
            {isLoading ? (
              <Loading isLoading={isLoading} isFullScreen={isFullScreen} currentUser={currentUser} /> // loading
            ) : (
              <Messages
                currentUser={currentUser}
                isLoading={isLoading}
                isFullScreen={isFullScreen}
                shouldRedirect={shouldRedirect}
                isProjectLevel={isProjectLevel}
              />
            )}

            {/* Chat Input */}
            <InputBox
              isProjectLevel
              isFullScreen={isFullScreen}
              activeChatId={activeChatId}
              shouldRedirect={shouldRedirect}
            />
          </div>
        </div>
      ) : (
        <NotAuthorizedView className="bg-transparent" />
      )}
    </>
  );
});
