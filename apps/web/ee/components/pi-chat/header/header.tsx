"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { PanelLeft, SquarePen } from "lucide-react";
import { BetaBadge, Button, PiChatLogo } from "@plane/ui";
import { cn } from "@plane/utils";
import { SidebarHamburgerToggle } from "@/components/core";
import { useAppTheme } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type THeaderProps = {
  isSidePanelOpen: boolean;
  isFullScreen: boolean;
  isNewChat: boolean;
  toggleSidePanel: (value: boolean) => void;
  initPiChat: (chat_id?: string) => void;
};
export const Header = observer((props: THeaderProps) => {
  const router = useAppRouter();
  const { initPiChat, isSidePanelOpen, toggleSidePanel, isFullScreen, isNewChat } = props;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { sidebarCollapsed } = useAppTheme();

  const handleNewConversation = async () => {
    const newChatId = initPiChat();
    router.push(`?chat_id=${newChatId}`, {}, { showProgressBar: false });
  };

  return (
    <div className="flex justify-between h-8">
      {/* Breadcrumb */}

      <div className="flex rounded gap-1">
        {sidebarCollapsed && <SidebarHamburgerToggle />}
        <PiChatLogo className="size-5 text-custom-text-300 fill-current m-auto align-center" />
        <span className="font-medium text-sm my-auto"> Pi Chat (GPT-4.1)</span>
        <BetaBadge />
      </div>
      {/* Actions */}
      {!isSidePanelOpen && (
        <div className="flex gap-2">
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className={cn(
              "flex items-center justify-center gap-2 h-8 w-8 rounded-lg shadow-sm transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-custom-border-300 disabled:!text-custom-text-300",
              {
                "w-32": isSearchOpen,
              }
            )}
            disabled={isNewChat}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
            onClick={handleNewConversation}
          >
            <SquarePen className="flex-shrink-0 size-4" />
            {isSearchOpen && <span className="text-xs text-nowrap font-medium">Start a new chat</span>}
          </Button>

          {isFullScreen && (
            <button
              type="button"
              className="flex items-center justify-center size-8 rounded-lg shadow-sm bg-custom-background-100 text-custom-text-400 hover:text-custom-text-200 border border-custom-border-100"
              onClick={() => toggleSidePanel(true)}
            >
              <PanelLeft className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});
