import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, LoaderCircle, Plus } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// constants
import { PROJECT_PAGE_TRACKER_ELEMENTS } from "@plane/constants";
// utils
import { cn } from "@plane/utils";
// types
import { SectionHeaderProps } from "../types";

/**
 * Component for rendering section header with label, icon and actions
 */
export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(
  ({ sectionType, sectionDetails, isCreatingPage, handleCreatePage, buttonRef, onButtonClick }) => {
    const { workspaceSlug } = useParams();

    return (
      <div
        className={cn(
          "group w-full flex items-center justify-between px-2 py-0.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90"
        )}
      >
        <Link
          href={`/${workspaceSlug}/wiki/${sectionType}`}
          className={cn("flex-grow text-sm font-semibold text-custom-sidebar-text-400")}
        >
          {sectionDetails.label}
        </Link>

        <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
          {sectionType !== "archived" && sectionType !== "shared" && (
            <button
              className="grid place-items-center hover:bg-custom-background-80 p-0.5 rounded"
              data-ph-element={PROJECT_PAGE_TRACKER_ELEMENTS.SIDEBAR}
              onClick={() => {
                handleCreatePage(sectionType);
              }}
            >
              {isCreatingPage === sectionType ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </button>
          )}
          <Disclosure.Button
            ref={buttonRef}
            as="button"
            type="button"
            className="grid place-items-center hover:bg-custom-background-80 p-0.5 rounded"
            onClick={(e) => {
              e.stopPropagation();
              if (onButtonClick) onButtonClick();
            }}
          >
            {({ open }) => (
              <ChevronRight
                className={cn("size-3.5 transform transition-transform duration-300 ease-in-out", {
                  "rotate-90": open,
                })}
              />
            )}
          </Disclosure.Button>
        </div>
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";
