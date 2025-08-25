"use client";
import { useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { useUser } from "@/hooks/store/user";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { Loading } from "./conversation/loading";
import { Messages } from "./conversation/messages";
import { scrollIntoViewHelper } from "./helper";
import { InputBox } from "./input";

type TProps = {
  isFullScreen?: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
};
export const PiChatDetail = observer((props: TProps) => {
  const { isFullScreen: isFullScreenProp = false, shouldRedirect = true, isProjectLevel = false } = props;
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
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
        <div
          className={cn(
            "px-page-x relative flex flex-col h-[90%] flex-1 align-middle justify-center max-w-[400px] md:m-auto w-full",
            {
              "max-w-[780px]": isFullScreen,
            }
          )}
        >
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
                setHasMoreMessages={setHasMoreMessages}
              />
            )}

            {/* Scroll to bottom button */}
            <button
              onClick={() => scrollIntoViewHelper("observer-element")}
              className={cn(
                "absolute bottom-[164px] left-1/2 -translate-x-1/2 bg-custom-background-100 p-1 rounded-full shadow z-10 transition-all duration-300 opacity-0 text-custom-text-200 border border-custom-border-100",
                {
                  "opacity-100": hasMoreMessages,
                }
              )}
            >
              <ChevronDown size={20} />
            </button>
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
