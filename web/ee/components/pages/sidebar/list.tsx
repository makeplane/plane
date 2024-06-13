"use client";

import { observer } from "mobx-react";
import { ChevronRight, Plus } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { TPageNavigationTabs } from "@plane/types";
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
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const { setTrackElement } = useEventTracker();
  const { toggleCreatePageModal } = useCommandPalette();
  const { currentWorkspacePublicPageIds, currentWorkspacePrivatePageIds, currentWorkspaceArchivePageIds } =
    useWorkspacePages();
  // derived values
  const isCollapsed = sidebarCollapsed || false;
  const totalPublicPages = currentWorkspacePublicPageIds?.length ?? 0;
  const totalPrivatePages = currentWorkspacePrivatePageIds?.length ?? 0;
  const totalArchivePages = currentWorkspaceArchivePageIds?.length ?? 0;

  const sectionsList: {
    [key in TPageNavigationTabs]: {
      key: TPageNavigationTabs;
      label: string;
      pageIds: string[] | undefined;
      shouldOpenByDefault: boolean;
    };
  } = {
    public: {
      key: "public",
      label: "Public pages",
      pageIds: currentWorkspacePublicPageIds,
      shouldOpenByDefault: totalPublicPages !== 0,
    },
    private: {
      key: "private",
      label: "Private pages",
      pageIds: currentWorkspacePrivatePageIds,
      shouldOpenByDefault: totalPublicPages === 0 && totalPrivatePages !== 0,
    },
    archived: {
      key: "archived",
      label: "Archived pages",
      pageIds: currentWorkspaceArchivePageIds,
      shouldOpenByDefault: totalPublicPages === 0 && totalPrivatePages === 0 && totalArchivePages !== 0,
    },
  };

  return (
    <div
      className={cn("vertical-scrollbar h-full space-y-2 !overflow-y-scroll pl-4 scrollbar-md", {
        "scrollbar-sm": isCollapsed,
      })}
    >
      {Object.values(sectionsList).map((section) => (
        <Disclosure key={section.key} as="div" className="flex flex-col" defaultOpen={section.key === "public"}>
          <>
            {!isCollapsed && (
              <div className="group w-full flex items-center justify-between rounded py-1.5 pl-1 pr-2 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80">
                <Disclosure.Button
                  as="button"
                  type="button"
                  className="w-full flex items-center gap-1 whitespace-nowrap rounded text-left text-sm font-semibold text-custom-sidebar-text-400"
                >
                  {({ open }) => (
                    <>
                      {section.label}
                      <ChevronRight
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": open,
                        })}
                      />
                    </>
                  )}
                </Disclosure.Button>
                {section.key !== "archived" && (
                  <button
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      setTrackElement("Sidebar");
                      toggleCreatePageModal({
                        isOpen: true,
                        pageAccess: section.key === "public" ? EPageAccess.PUBLIC : EPageAccess.PRIVATE,
                      });
                    }}
                  >
                    <Plus className="size-3" strokeWidth={3} />
                  </button>
                )}
              </div>
            )}
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
                className={cn({
                  "ml-1": !sidebarCollapsed,
                })}
              >
                {section.pageIds?.map((pageId) => <PagesAppSidebarListItem key={pageId} pageId={pageId} />)}
              </Disclosure.Panel>
            </Transition>
          </>
        </Disclosure>
      ))}
    </div>
  );
});
