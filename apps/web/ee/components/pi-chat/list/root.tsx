import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import PiChatList from "./list";

const AllChats = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { geUserThreads, isLoadingThreads } = usePiChat();
  const userThreads = geUserThreads();

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between w-full">
        <div className="font-semibold text-custom-text-300 text-xl">Chats</div>
        <Link
          href={`/${workspaceSlug}/pi-chat/new`}
          className="flex items-center font-medium gap-2 text-custom-text-200 hover:text-custom-text-100 text-sm border border-custom-border-200 rounded-md px-2 py-1"
        >
          New chat
        </Link>
      </div>
      <PiChatList userThreads={userThreads} isLoading={isLoadingThreads} />
    </div>
  );
});

export default AllChats;
