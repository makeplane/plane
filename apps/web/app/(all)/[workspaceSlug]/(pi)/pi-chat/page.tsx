"use client";

import { cn } from "@plane/utils";
import { PageHead } from "@/components/core";
import AllChats from "@/plane-web/components/pi-chat/list/root";

const PiChatPage = () => (
  <>
    <PageHead title="Pi Chat" />
    <div className="relative flex flex-col flex-1 align-middle justify-center items-center max-w-[780px] md:m-auto w-full overflow-scroll">
      <div className={cn("flex-1 w-full my-auto flex h-full pt-8")}>
        <AllChats />
      </div>
    </div>
  </>
);

export default PiChatPage;
