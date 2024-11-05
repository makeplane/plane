"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { PanelRight, SquarePen } from "lucide-react";
import { cn } from "@/helpers/common.helper";
import { useAppRouter } from "@/hooks/use-app-router";
import PiChatLogo from "@/public/logos/pi.png";

type THeaderProps = {
  initPiChat: (chat_id?: string) => void;
  isSidePanelOpen: boolean;
  toggleSidePanel: (value: boolean) => void;
  isFullScreen: boolean;
};
export const Header = observer((props: THeaderProps) => {
  const router = useAppRouter();
  const { initPiChat, isSidePanelOpen, toggleSidePanel, isFullScreen } = props;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNewConversation = async () => {
    const newChatId = initPiChat();
    router.push(`?chat_id=${newChatId}`);
  };
  return (
    <div className="flex justify-between h-8">
      {/* Breadcrumb */}
      <div className="flex">
        <Image width={16} height={16} src={PiChatLogo} alt="Pi" className="my-auto" />
        <span className="font-medium text-sm my-auto"> Pi Chat</span>
      </div>
      {/* Actions */}
      {!isSidePanelOpen && (
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 h-8 w-8 rounded-lg shadow-sm bg-pi-100 border border-pi-200 transition-[width] ease-linear overflow-hidden",
              {
                "w-32": isSearchOpen,
              }
            )}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
            onClick={handleNewConversation}
          >
            <SquarePen className="flex-shrink-0 size-4 text-indigo-800" />
            {isSearchOpen && (
              <span className="text-custom-text-300 text-xs text-nowrap font-medium">Start a new chat</span>
            )}
          </button>

          {isFullScreen && (
            <button
              type="button"
              className="flex items-center justify-center size-8 rounded-lg shadow-sm bg-custom-background-100 text-custom-text-400 hover:text-custom-text-200 border border-custom-border-100"
              onClick={() => toggleSidePanel(true)}
            >
              <PanelRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
