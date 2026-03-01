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

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import type { IUser } from "@plane/types";
import { cn } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { scrollIntoViewHelper } from "../helper";
import { SavePageModal } from "../modals/save-page-modal";
import { AiMessage } from "./ai-message";
import { MyMessage } from "./my-message";

type TProps = {
  isLoading: boolean;
  currentUser: IUser | undefined;
  isFullScreen: boolean;
  shouldRedirect?: boolean;
  isProjectLevel?: boolean;
  setHasMoreMessages: (value: boolean) => void;
};

export const Messages = observer(function Messages(props: TProps) {
  const { isLoading, setHasMoreMessages } = props;
  // store
  const { activeChat, regenerateAnswer, convertToPage } = usePiChat();
  // ref
  const containerRef = useRef(null);
  // state
  const [savePageQueryId, setSavePageQueryId] = useState<string | undefined>(undefined);
  // router
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("message_token");
  const routerChatId = searchParams.get("chat_id");
  const { chatId, workspaceSlug } = useParams();
  // handlers
  const checkIfHasMore = () => {
    const el: HTMLElement | null = containerRef.current;
    if (!el || activeChat?.dialogue?.length === 0) return;

    const isOverflowing = (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight;
    const isNotAtBottom =
      (el as HTMLElement).scrollTop + (el as HTMLElement).clientHeight < (el as HTMLElement).scrollHeight - 1;

    setHasMoreMessages(isOverflowing && isNotAtBottom);
  };
  const handleRegenerateIfTokenExists = async () => {
    const chatIdToUse = chatId || routerChatId;
    if (token && chatIdToUse) {
      await regenerateAnswer(chatIdToUse.toString(), token, activeChat?.workspace_id);
      // remove token from url
      router.push(pathname);
    }
  };
  const handleConvertToPage = async (
    projectId: string | undefined
  ): Promise<
    | {
        page_url: string;
      }
    | undefined
  > => {
    if (!savePageQueryId) return;
    const message = activeChat?.dialogueMap[savePageQueryId];
    const response = await convertToPage(
      message.answer?.toString() || "",
      workspaceSlug?.toString() || "",
      projectId,
      activeChat?.chat_id?.toString() || ""
    );
    return response;
  };

  useEffect(() => {
    const el: HTMLElement | null = containerRef.current;
    if (!el) return;

    checkIfHasMore();

    (el as HTMLElement).addEventListener("scroll", checkIfHasMore);
    window.addEventListener("resize", checkIfHasMore);

    return () => {
      (el as HTMLElement).removeEventListener("scroll", checkIfHasMore);
      window.removeEventListener("resize", checkIfHasMore);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeChat?.dialogue || activeChat?.dialogue.length === 0) return;
    void handleRegenerateIfTokenExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.dialogue]);

  useEffect(() => {
    //Always scroll to the latest message
    if (!activeChat?.dialogue) return;
    if (activeChat?.dialogue.length === 0) setHasMoreMessages(false);
    void scrollIntoViewHelper(`${activeChat?.dialogue?.length - 1}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?.dialogue?.length]);

  if (!activeChat?.dialogue || activeChat?.dialogue.length === 0) return;
  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-8 max-h-full h-full w-full mx-auto overflow-y-scroll pt-6 pb-[230px]")}
    >
      {activeChat?.dialogue?.map((query_id: string, index: number) => {
        const message = activeChat?.dialogueMap[query_id];
        return (
          <div key={index} className="space-y-8">
            <MyMessage message={message.query} id={index.toString()} attachments={message.attachment_ids} />
            <AiMessage
              dialogue={message}
              id={index.toString()}
              isLatest={index === activeChat?.dialogue.length - 1}
              handleConvertToPage={() => message.query_id && setSavePageQueryId(message.query_id)}
            />
          </div>
        );
      })}

      {/* Loading */}
      {isLoading && <AiMessage isLoading={isLoading} />}
      {isLoading && <MyMessage isLoading={isLoading} />}
      {/* observer element */}
      <div id="observer-element" />
      {/* save page modal */}
      <SavePageModal
        workspaceSlug={workspaceSlug?.toString() || ""}
        isOpen={!!savePageQueryId}
        handleModalClose={() => setSavePageQueryId(undefined)}
        handleConvertToPage={handleConvertToPage}
      />
    </div>
  );
});
