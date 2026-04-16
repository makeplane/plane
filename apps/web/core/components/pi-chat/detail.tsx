/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { useUser } from "@/hooks/store/user";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TChatContextData } from "@/types";
import { Loading } from "./conversation/loading";
import { Messages } from "./conversation/messages";
import { scrollIntoViewHelper } from "./helper";
import { InputBox } from "./input";
import { UnauthorizedView } from "./unauthorized";

type TProps = {
  isFullScreen?: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
  contextData?: TChatContextData;
};
export const PiChatDetail = observer(function PiChatDetail(props: TProps) {
  const { isFullScreen: isFullScreenProp = false, shouldRedirect = true, isProjectLevel = false, contextData } = props;
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  // router
  const pathName = usePathname();
  // store hooks
  const { isAuthorized: isChatAuthorized, isWorkspaceAuthorized, isLoading, activeChatId } = usePiChat();
  const { data: currentUser } = useUser();
  // derived values
  const isFullScreen = pathName.includes("ai-chat") || isFullScreenProp;
  return (
    <>
      {isChatAuthorized && isWorkspaceAuthorized ? (
        <div
          className={cn("px-4 relative flex flex-col h-[90%] flex-1 align-middle justify-center md:m-auto w-full", {
            "max-w-[780px] md:px-10": isFullScreen,
          })}
        >
          <div className={cn("flex-1 my-auto flex flex-col h-full relative")}>
            {isLoading ? (
              <Loading isLoading={isLoading} isFullScreen={isFullScreen} /> // loading
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
            {activeChatId && (
              <button
                onClick={() => void scrollIntoViewHelper("observer-element")}
                className={cn(
                  "absolute bottom-[164px] left-1/2 -translate-x-1/2 bg-surface-1 p-1 rounded-full shadow z-10 transition-all duration-300 opacity-0 text-secondary border border-subtle",
                  {
                    "opacity-100": hasMoreMessages,
                  }
                )}
              >
                <ChevronDownIcon height={20} width={20} />
              </button>
            )}
            {/* Chat Input */}
            <InputBox
              contextData={contextData}
              isProjectLevel={isProjectLevel}
              isFullScreen={isFullScreen}
              activeChatId={activeChatId}
              shouldRedirect={shouldRedirect}
            />
          </div>
        </div>
      ) : isWorkspaceAuthorized ? (
        <NotAuthorizedView className="bg-transparent" />
      ) : (
        <UnauthorizedView />
      )}
    </>
  );
});
