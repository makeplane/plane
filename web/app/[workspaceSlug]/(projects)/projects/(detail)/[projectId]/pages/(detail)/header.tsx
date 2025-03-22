"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText, Link, LockKeyhole, LockKeyholeOpen } from "lucide-react";
// constants
import { IS_FAVORITE_MENU_OPEN } from "@plane/constants";
// hooks
import { useLocalStorage } from "@plane/hooks";
// types
import { TLogoProps } from "@plane/types";
// ui
import {
  Breadcrumbs,
  EmojiIconPicker,
  EmojiIconPickerTypes,
  FavoriteStar,
  Header,
  TOAST_TYPE,
  Tooltip,
  setToast,
} from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useProject } from "@/hooks/store";
import { usePageOperations } from "@/hooks/use-page-operations";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
// plane web hooks
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

export const PageDetailsHeader = observer(() => {
  // router
  const { workspaceSlug, pageId } = useParams();
  // state
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType: EPageStoreType.PROJECT,
  });
  if (!page) return null;
  // derived values
  const { name, logo_props, updatePageLogo, isContentEditable } = page;
  // use platform
  const { isMobile } = usePlatformOS();

  const handlePageLogoUpdate = async (data: TLogoProps) => {
    if (data) {
      updatePageLogo(data)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Logo Updated successfully.",
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
        });
    }
  };

  const pageTitle = getPageName(name);

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <span>
                  <span className="hidden md:block">
                    <ProjectBreadcrumb />
                  </span>
                  <span className="md:hidden">
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      label={"..."}
                    />
                  </span>
                </span>
              }
            />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages`}
                  label="Pages"
                  icon={<FileText className="h-4 w-4 text-custom-text-300" />}
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <li className="flex items-center space-x-2" tabIndex={-1}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex cursor-default items-center gap-1 text-sm font-medium text-custom-text-100">
                      <div className="flex h-5 w-5 items-center justify-center overflow-hidden">
                        <EmojiIconPicker
                          isOpen={isOpen}
                          handleToggle={(val: boolean) => setIsOpen(val)}
                          className="flex items-center justify-center"
                          buttonClassName="flex items-center justify-center"
                          label={
                            <>
                              {logo_props?.in_use ? (
                                <Logo logo={logo_props} size={16} type="lucide" />
                              ) : (
                                <FileText className="h-4 w-4 text-custom-text-300" />
                              )}
                            </>
                          }
                          onChange={(val) => {
                            let logoValue = {};

                            if (val?.type === "emoji")
                              logoValue = {
                                value: convertHexEmojiToDecimal(val.value.unified),
                                url: val.value.imageUrl,
                              };
                            else if (val?.type === "icon") logoValue = val.value;

                            handlePageLogoUpdate({
                              in_use: val?.type,
                              [val?.type]: logoValue,
                            }).finally(() => setIsOpen(false));
                          }}
                          defaultIconColor={
                            logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined
                          }
                          defaultOpen={
                            logo_props?.in_use && logo_props?.in_use === "emoji"
                              ? EmojiIconPickerTypes.EMOJI
                              : EmojiIconPickerTypes.ICON
                          }
                          disabled={!isContentEditable}
                        />
                      </div>
                      <Tooltip tooltipContent={pageTitle} position="bottom" isMobile={isMobile}>
                        <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">
                          {pageTitle}
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </li>
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center gap-3">
          {/* <PageEditInformationPopover page={page} /> */}
          <PageActionButtons page={page} storeType={EPageStoreType.PROJECT} />
        </div>
      </Header.RightItem>
    </Header>
  );
});

// PageActions Component
export type TPageActions = "toggle-lock" | "copy-link";

// Lock states
type LockDisplayState = "icon-only" | "locked" | "unlocked";

// Enhanced lock component with multiple states
const EnhancedLockControl = ({
  isLocked,
  canToggle,
  onToggle,
}: {
  isLocked: boolean;
  canToggle: boolean;
  onToggle: () => void;
}) => {
  // Track visual display state
  const [displayState, setDisplayState] = useState<LockDisplayState>(isLocked ? "locked" : "icon-only");
  // Use ref to track timeout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timers on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // Watch only for isLocked changes and update display state accordingly
  useEffect(() => {
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isLocked) {
      // If locked, always show locked state
      setDisplayState("locked");
    } else {
      // If not locked and was previously showing something other than icon-only
      // First show unlocked state, then transition back
      if (displayState !== "icon-only") {
        setDisplayState("unlocked");
        timerRef.current = setTimeout(() => {
          setDisplayState("icon-only");
          timerRef.current = null;
        }, 600); // Adjusted from 800ms to 600ms for better timing
      } else {
        // Otherwise, just show icon-only
        setDisplayState("icon-only");
      }
    }
  }, [isLocked, displayState]); // Only depend on isLocked, not displayState

  if (!canToggle) return null;
  // Handle click with state transitions
  const handleClick = () => {
    onToggle(); // This will update isLocked which will trigger the useEffect
  };

  // Determine what to render based on current display state
  const renderLockControl = () => {
    switch (displayState) {
      case "icon-only":
        return (
          <Tooltip tooltipContent="Lock" position="bottom">
            <div
              onClick={handleClick}
              className="w-6 h-6 flex items-center justify-center rounded-full cursor-pointer
                         transition-all duration-700 text-custom-text-400
                         hover:bg-custom-background-90 hover:text-custom-text-100"
              aria-label="Lock"
            >
              <LockKeyhole className="h-3.5 w-3.5 transition-all hover:scale-110" />
            </div>
          </Tooltip>
        );

      case "locked":
        return (
          <div
            onClick={handleClick}
            className="h-6 flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer
                       text-blue-500 transition-all duration-500 hover:bg-blue-50/10"
            aria-label="Locked"
          >
            <LockKeyhole className="h-3.5 w-3.5 flex-shrink-0 animate-lock-icon" />
            <span
              className="text-xs font-medium whitespace-nowrap overflow-hidden
                         transition-all duration-500 ease-out animate-text-slide-in"
            >
              Locked
            </span>
          </div>
        );

      case "unlocked":
        return (
          <div
            className="h-6 flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer
                     text-custom-text-800 transition-all duration-500 animate-fade-out"
            aria-label="Unlocked"
          >
            <LockKeyholeOpen className="h-3.5 w-3.5 flex-shrink-0 animate-unlock-icon" />
            <span
              className="text-xs font-medium whitespace-nowrap overflow-hidden
                         transition-all duration-500 ease-out animate-text-slide-in animate-text-fade-out"
            >
              Unlocked
            </span>
          </div>
        );
    }
  };

  return renderLockControl();
};

export const PageActionButtons = observer(({ page, storeType }: { page: TPageInstance; storeType: EPageStoreType }) => {
  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  // derived values
  const {
    is_locked,
    is_favorite,
    canCurrentUserLockPage,
    canCurrentUserFavoritePage,
    addToFavorites,
    removePageFromFavorites,
  } = page;

  // local storage for favorites menu
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );

  // favorite handler
  const handleFavorite = useCallback(() => {
    if (is_favorite) {
      removePageFromFavorites().then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page removed from favorites.",
        })
      );
    } else {
      addToFavorites().then(() => {
        if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Page added to favorites.",
        });
      });
    }
  }, [is_favorite, addToFavorites, removePageFromFavorites, isFavoriteMenuOpen, toggleFavoriteMenu]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <EnhancedLockControl
          isLocked={is_locked}
          canToggle={canCurrentUserLockPage}
          onToggle={pageOperations.toggleLock}
        />

        <Tooltip tooltipContent="Copy link" position="bottom">
          <div
            onClick={pageOperations.copyLink}
            className="w-7 h-7 flex items-center justify-center rounded-full text-custom-text-400
                     hover:bg-custom-background-90 hover:text-custom-text-100 transition-all
                     duration-200 cursor-pointer"
            aria-label="Copy link"
          >
            <Link className="h-3.5 w-3.5" />
          </div>
        </Tooltip>
      </div>
      {canCurrentUserFavoritePage && (
        <FavoriteStar
          selected={is_favorite}
          onClick={handleFavorite}
          buttonClassName="flex-shrink-0"
          iconClassName="text-custom-text-400"
        />
      )}
    </div>
  );
});
