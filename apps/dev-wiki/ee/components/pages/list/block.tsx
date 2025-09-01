"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { FileText } from "lucide-react";
// plane imports
import { EmojiIconPicker, EmojiIconPickerTypes } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
// helpers
import { getPageName } from "@/helpers/page.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { PageListBlockItemAction } from "@/plane-web/components/pages";
// plane web hooks
import { EPageStoreType, usePage } from "@/plane-web/hooks/store";

type TPageListBlock = {
  workspaceSlug: string;
  pageId: string;
};

export const WikiPageListBlock: FC<TPageListBlock> = observer((props) => {
  const { workspaceSlug, pageId } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // refs
  const parentRef = useRef(null);
  // store hooks
  const page = usePage({
    pageId,
    storeType: EPageStoreType.WORKSPACE,
  });
  // derived values
  const { name, logo_props, updatePageLogo } = page ?? {};
  // platform
  const { isMobile } = usePlatformOS();

  if (!page) return null;

  return (
    <ListItem
      prependTitleElement={
        <>
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
            onChange={(val) => updatePageLogo?.(val)}
            defaultIconColor={logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined}
            defaultOpen={
              logo_props?.in_use && logo_props?.in_use === "emoji"
                ? EmojiIconPickerTypes.EMOJI
                : EmojiIconPickerTypes.ICON
            }
          />
        </>
      }
      title={getPageName(name)}
      itemLink={`/${workspaceSlug}/pages/${pageId}`}
      actionableItems={<PageListBlockItemAction workspaceSlug={workspaceSlug} page={page} parentRef={parentRef} />}
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={isOpen}
    />
  );
});
