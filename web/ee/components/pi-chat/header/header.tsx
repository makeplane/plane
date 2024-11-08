"use-client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, PanelRight, SquarePen } from "lucide-react";
import { PiChatLogo } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import { useAppRouter } from "@/hooks/use-app-router";
import { TAiModels } from "@/plane-web/types";
import { ModelsDropdown } from "./models-dropdown";

type THeaderProps = {
  isSidePanelOpen: boolean;
  isFullScreen: boolean;
  models: TAiModels[];
  isNewChat: boolean;
  setActiveModel: (model: TAiModels) => void;
  toggleSidePanel: (value: boolean) => void;
  initPiChat: (chat_id?: string) => void;
};
export const Header = observer((props: THeaderProps) => {
  const router = useAppRouter();
  const { initPiChat, isSidePanelOpen, toggleSidePanel, isFullScreen, models, isNewChat, setActiveModel } = props;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNewConversation = async () => {
    const newChatId = initPiChat();
    router.push(`?chat_id=${newChatId}`, {}, { showProgressBar: false });
  };

  return (
    <div className="flex justify-between h-8">
      {/* Breadcrumb */}
      <ModelsDropdown
        models={models}
        setActiveModel={setActiveModel}
        customButton={
          <button className="flex hover:bg-custom-background-80 p-2 rounded gap-1">
            <PiChatLogo className="size-5 text-custom-text-300 fill-current m-auto align-center" />
            <span className="font-medium text-sm my-auto"> Pi Chat</span>
            <ChevronDown
              className={cn("ml-2 size-3 my-auto text-custom-text-300 hover:text-custom-text-200 duration-300")}
            />
          </button>
        }
      />

      {/* Actions */}
      {!isSidePanelOpen && (
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 h-8 w-8 rounded-lg shadow-sm bg-pi-100 border border-custom-border-300 transition-[width] ease-linear overflow-hidden",
              {
                "w-32": isSearchOpen,
              }
            )}
            disabled={isNewChat}
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
            onClick={handleNewConversation}
          >
            <SquarePen className="flex-shrink-0 size-4 text-custom-text-300" />
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
