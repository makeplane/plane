"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Globe2, Lock, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { TPageNavigationTabs } from "@plane/types";
// ui
import { ArchiveIcon, Tooltip } from "@plane/ui";
// constants
import { EPageAccess } from "@/constants/page";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useCommandPalette, useEventTracker } from "@/hooks/store";
// plane web components
import { PagesAppSidebarListItem } from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";

export const PagesAppSidebarList = observer(() => {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { toggleCreatePageModal } = useCommandPalette();
  const { getCurrentWorkspacePageIdsByType } = useWorkspacePages();
  // derived values
  const isCollapsed = sidebarCollapsed || false;

  const sectionsList: {
    [key in TPageNavigationTabs]: {
      key: TPageNavigationTabs;
      label: string;
      icon: any;
      pageIds: string[] | undefined;
    };
  } = {
    public: {
      key: "public",
      label: "Public pages",
      icon: Globe2,
      pageIds: getCurrentWorkspacePageIdsByType("public"),
    },
    private: {
      key: "private",
      label: "Private pages",
      icon: Lock,
      pageIds: getCurrentWorkspacePageIdsByType("private"),
    },
    archived: {
      key: "archived",
      label: "Archived pages",
      icon: ArchiveIcon,
      pageIds: getCurrentWorkspacePageIdsByType("archived"),
    },
  };

  return (
    <div
      className={cn("vertical-scrollbar h-full space-y-4 !overflow-y-scroll scrollbar-sm -mr-3 -ml-4 pl-4", {
        "space-y-0": isCollapsed,
      })}
    >
      {Object.values(sectionsList).map((section) => (
        <Disclosure key={section.key} as="div" className="flex flex-col" defaultOpen={section.key === "public"}>
          <>
            <div
              className={cn(
                "group w-full flex items-center justify-between px-2 py-0.5 rounded text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90",
                {
                  "p-0 size-8 justify-center mx-auto": isCollapsed,
                }
              )}
            >
              <Tooltip tooltipHeading={section.label} tooltipContent="" position="right" disabled={!isCollapsed}>
                <Link
                  href={`/${workspaceSlug}/pages/${section.key}`}
                  className={cn("flex-grow text-sm font-semibold text-custom-sidebar-text-400", {
                    "flex justify-center": isCollapsed,
                  })}
                >
                  {isCollapsed ? <section.icon className="size-4 text-custom-sidebar-text-200" /> : section.label}
                </Link>
              </Tooltip>
              {!isCollapsed && (
                <div className="flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  {section.key !== "archived" && (
                    <button
                      className="grid place-items-center hover:bg-custom-background-80 p-0.5 rounded"
                      onClick={() => {
                        setTrackElement("Sidebar");
                        toggleCreatePageModal({
                          isOpen: true,
                          pageAccess: section.key === "public" ? EPageAccess.PUBLIC : EPageAccess.PRIVATE,
                        });
                      }}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                  <Disclosure.Button
                    as="button"
                    type="button"
                    className="grid place-items-center hover:bg-custom-background-80 p-0.5 rounded"
                  >
                    {({ open }) => (
                      <ChevronRight
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": open,
                        })}
                      />
                    )}
                  </Disclosure.Button>
                </div>
              )}
            </div>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel
                as="div"
                className={cn("ml-1 mt-2", {
                  hidden: isCollapsed,
                })}
              >
                {section.pageIds && section.pageIds.length > 0 ? (
                  section.pageIds.map((pageId) => <PagesAppSidebarListItem key={pageId} pageId={pageId} />)
                ) : (
                  <p className="text-custom-text-400 text-xs text-center font-medium ml-1 mt-2">
                    No {section.key} pages
                  </p>
                )}
              </Disclosure.Panel>
            </Transition>
          </>
        </Disclosure>
      ))}
    </div>
  );
});
