"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Search, SquarePen, X } from "lucide-react";
// helpers
import { Button } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  initPiChat: (chat_id?: string) => void;
  searchQuery: string;
  isNewChat: boolean;
  updateSearchQuery: (value: string) => void;
};

export const Toolbar: FC<Props> = observer((props) => {
  const { initPiChat, searchQuery, isNewChat, updateSearchQuery } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const router = useAppRouter();

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  const handleNewConversation = async () => {
    const newChatId = initPiChat();
    router.push(`?chat_id=${newChatId}`, {}, { showProgressBar: false });
  };

  return (
    <div className="flex items-center justify-between gap-2 h-8 w-full">
      {/* New */}
      <Button
        variant="accent-primary"
        className={cn(
          "flex items-center justify-center gap-2 h-8 w-8 rounded-lg shadow-sm transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-custom-border-300 disabled:!text-custom-text-300",
          {
            "w-full justify-center": !isSearchOpen,
          }
        )}
        onClick={handleNewConversation}
        disabled={isNewChat}
      >
        <SquarePen className="flex-shrink-0 size-4" />
        {!isSearchOpen && <span className="text-xs text-nowrap font-medium">Start a new chat</span>}
      </Button>
      {/* Search */}
      <div className="flex items-center">
        {!isSearchOpen && (
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-lg shadow-sm bg-custom-background-100 text-custom-text-400 hover:text-custom-text-200 border border-custom-border-100"
            onClick={() => {
              setIsSearchOpen(true);
              inputRef.current?.focus();
            }}
          >
            <Search className="size-4" />
          </button>
        )}

        <div
          className={cn(
            "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-90 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
            {
              "w-full px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
            }
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <input
            ref={inputRef}
            className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {isSearchOpen && (
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                updateSearchQuery("");
                setIsSearchOpen(false);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
