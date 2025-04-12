import { useRef, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { TPage, TPageNavigationTabs } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// local imports
import { SectionHeader, SectionContent } from "./components";
import { SECTION_DETAILS } from "./constants";
import { useSectionDragAndDrop, useSectionPages } from "./hooks";
import { SectionRootProps } from "./types";

export const WikiSidebarListSectionRoot: React.FC<SectionRootProps> = observer((props) => {
  const { expandedPageIds, sectionType, setExpandedPageIds, currentPageId } = props;

  // states
  const [isCreatingPage, setIsCreatingPage] = useState<TPageNavigationTabs | null>(null);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);

  // refs
  const listSectionRef = useRef<HTMLDivElement>(null);

  // hooks
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { sidebarCollapsed } = useAppTheme();
  const { createPage, getPageById } = usePageStore(EPageStoreType.WORKSPACE);

  // Custom hooks
  const { isDropping } = useSectionDragAndDrop(listSectionRef, getPageById);
  const { pageIds, isLoading } = useSectionPages(sectionType);

  // Set initial render complete after first load
  useEffect(() => {
    if (!isLoading && !initialRenderComplete) {
      setInitialRenderComplete(true);
    }
  }, [isLoading, initialRenderComplete]);

  // Debug log when current page ID and pageIds change
  useEffect(() => {
    if (currentPageId) {
      console.log(
        `Section: ${sectionType}, currentPageId: ${currentPageId}, includes: ${pageIds.includes(currentPageId)}, pageIds: ${pageIds.length > 0 ? pageIds.join(", ") : "none"}`
      );
    }
  }, [currentPageId, pageIds, sectionType]);

  // Determine if this section should be open
  const shouldBeOpen = () => {
    // If we have a current page ID and it's in this section's pageIds, open this section
    if (currentPageId && pageIds.includes(currentPageId)) {
      return true;
    }

    // If we're still loading or haven't completed initial render, default to public section
    if (isLoading || !initialRenderComplete) {
      const defaultOpen = sectionType === "public" && !currentPageId;
      return defaultOpen;
    }

    // If there's no current page ID, only open the public section by default
    if (!currentPageId) {
      return sectionType === "public";
    }

    // In all other cases, keep section closed by default
    return false;
  };

  // derived values
  const isCollapsed = !!sidebarCollapsed;
  const sectionDetails = SECTION_DETAILS[sectionType];

  // handle page create
  const handleCreatePage = async (pageType: TPageNavigationTabs) => {
    setIsCreatingPage(pageType);

    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        })
      )
      .finally(() => setIsCreatingPage(null));
  };

  return (
    <div
      ref={listSectionRef}
      className={cn("flex flex-col rounded-md transition-colors", {
        "[&:not(:has(.is-dragging))]:bg-custom-primary-100/20": isDropping,
      })}
    >
      <Disclosure defaultOpen={shouldBeOpen()}>
        {({ open }) => (
          <>
            <SectionHeader
              sectionType={sectionType}
              sectionDetails={sectionDetails}
              isCollapsed={isCollapsed}
              isCreatingPage={isCreatingPage}
              handleCreatePage={handleCreatePage}
            />

            <Transition
              show={open}
              enter="transition-all duration-300 ease-in-out"
              enterFrom="opacity-0 max-h-0 overflow-hidden"
              enterTo="opacity-100 max-h-[1000px] overflow-hidden"
              leave="transition-all duration-200 ease-in-out"
              leaveFrom="opacity-100 max-h-[1000px] overflow-hidden"
              leaveTo="opacity-0 max-h-0 overflow-hidden"
            >
              <SectionContent
                isCollapsed={isCollapsed}
                pageIds={pageIds}
                sectionType={sectionType}
                expandedPageIds={expandedPageIds}
                setExpandedPageIds={setExpandedPageIds}
              />
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
});
