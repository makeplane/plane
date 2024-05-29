import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { FileText } from "lucide-react";
// types
import { TLogoProps } from "@plane/types";
// ui
import { EmojiIconPicker, EmojiIconPickerTypes, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { usePage } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TPageListBlock = {
  workspaceSlug: string;
  projectId: string;
  pageId: string;
};

export const PageListBlock: FC<TPageListBlock> = observer((props) => {
  const { workspaceSlug, projectId, pageId } = props;
  // refs
  const parentRef = useRef(null);
  // state
  const [isOpen, setIsOpen] = useState(false);
  // hooks
  const { name, logo_props, updatePageLogo } = usePage(pageId);
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
      itemLink={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}`}
      actionableItems={
        <BlockItemAction workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} parentRef={parentRef} />
      }
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={isOpen}
    />
  );
});
