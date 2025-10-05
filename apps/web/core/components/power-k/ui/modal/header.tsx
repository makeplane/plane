"use client";

import React from "react";
import { Command } from "cmdk";
import { X, Search } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import type { TPowerKContextType, TPowerKPageType } from "../../core/types";
import { POWER_K_MODAL_PAGE_DETAILS } from "./constants";

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeContext: TPowerKContextType | null;
  onClearContext: () => void;
  activePage: TPowerKPageType | null;
};

export const PowerKModalHeader: React.FC<Props> = (props) => {
  const { activeContext, searchTerm, onSearchChange, onClearContext, activePage } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const placeholder = activePage
    ? POWER_K_MODAL_PAGE_DETAILS[activePage].i18n_placeholder
    : t("power_k.page_placeholders.default");

  return (
    <div className="border-b border-custom-border-200">
      {/* Context Indicator */}
      {/* {contextEntity && !activePage && (
        <div className="flex items-center justify-between border-b border-custom-border-200 bg-custom-primary-100/10 px-4 py-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex-shrink-0 text-xs font-medium uppercase text-custom-primary-100">
              {contextEntity.type.replace("-", " ")}
            </span>
            <span className="truncate text-sm text-custom-text-100">
              {contextEntity.identifier || contextEntity.title}
            </span>
          </div>
          <button
            onClick={onClearContext}
            className="flex-shrink-0 rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
            title="Clear context (Backspace)"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )} */}

      {/* Search Input */}
      <div className="flex items-center gap-2 px-4 py-3">
        <Search className="h-4 w-4 flex-shrink-0 text-custom-text-400" />
        <Command.Input
          value={searchTerm}
          onValueChange={onSearchChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-custom-text-100 placeholder-custom-text-400 outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="flex-shrink-0 rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
