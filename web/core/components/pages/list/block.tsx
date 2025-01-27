"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import { FileText } from "lucide-react";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list";
// helpers
import { getPageName } from "@/helpers/page.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TUsePage } from "@/store/pages/base-page";

type TPageListBlock = {
  pageId: string;
  usePage: TUsePage;
};

export const PageListBlock: FC<TPageListBlock> = observer((props) => {
  const { pageId, usePage } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const page = usePage(pageId);
  const { isMobile } = usePlatformOS();
  // derived values
  const { name, logo_props, getRedirectionLink } = page;

  return (
    <ListItem
      prependTitleElement={
        <>
          {logo_props?.in_use ? (
            <Logo logo={logo_props} size={16} type="lucide" />
          ) : (
            <FileText className="h-4 w-4 text-custom-text-300" />
          )}
        </>
      }
      title={getPageName(name)}
      itemLink={getRedirectionLink()}
      actionableItems={<BlockItemAction page={page} parentRef={parentRef} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
