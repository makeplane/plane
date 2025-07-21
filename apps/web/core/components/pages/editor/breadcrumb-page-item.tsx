"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { FileText } from "lucide-react";
// plane imports
import { EmojiIconPicker, EmojiIconPickerTypes, Tooltip } from "@plane/ui";
import { getPageName } from "@plane/utils";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";

export interface IPageBreadcrumbProps {
  pageId: string;
  storeType: EPageStoreType;
  href?: string;
  showLogo?: boolean;
  isEditable?: boolean;
}

export const PageBreadcrumbItem: React.FC<IPageBreadcrumbProps> = observer(
  ({ pageId, storeType, href, showLogo = true, isEditable }) => {
    // states
    const [isOpen, setIsOpen] = useState(false);

    // hooks
    const { isMobile } = usePlatformOS();
    const page = usePage({
      pageId: pageId,
      storeType: storeType,
    });

    const { name, logo_props, updatePageLogo, isContentEditable } = page ?? {};

    // Show loading state when the page data isn't available yet
    if (!page) {
      const loadingItemClasses = href ? "" : "flex items-center space-x-2";

      if (href) {
        return (
          <div className="flex items-center gap-1 font-medium text-sm text-custom-text-200">
            {showLogo && <div className="h-4 w-4 bg-custom-background-80 rounded animate-pulse" />}
            <div className="h-4 w-24 bg-custom-background-80 rounded animate-pulse" />
          </div>
        );
      }

      return (
        <li className={loadingItemClasses} tabIndex={-1}>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex cursor-default items-center gap-1 text-sm font-medium text-custom-text-100">
              {showLogo && <div className="h-5 w-5 bg-custom-background-80 rounded animate-pulse" />}
              <div className="h-4 w-24 bg-custom-background-80 rounded animate-pulse" />
            </div>
          </div>
        </li>
      );
    }

    if (href) {
      return (
        <BreadcrumbLink
          href={href}
          label={getPageName(name)}
          icon={
            showLogo && (
              <>
                {logo_props?.in_use ? (
                  <Logo logo={logo_props} size={16} type="lucide" />
                ) : (
                  <FileText className="size-4 text-custom-text-300" />
                )}
              </>
            )
          }
        />
      );
    }

    return (
      <li className="flex items-center space-x-2" tabIndex={-1}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex cursor-default items-center gap-1 text-sm font-medium text-custom-text-100">
            {showLogo && (
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
                        <FileText className="size-4 text-custom-text-300" />
                      )}
                    </>
                  }
                  onChange={(val) => updatePageLogo?.(val)}
                  defaultIconColor={
                    logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined
                  }
                  defaultOpen={
                    logo_props?.in_use && logo_props?.in_use === "emoji"
                      ? EmojiIconPickerTypes.EMOJI
                      : EmojiIconPickerTypes.ICON
                  }
                  disabled={!isEditable && !isContentEditable}
                />
              </div>
            )}
            <Tooltip tooltipContent={getPageName(name)} position="bottom" isMobile={isMobile}>
              <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">
                {getPageName(name)}
              </div>
            </Tooltip>
          </div>
        </div>
      </li>
    );
  }
);
