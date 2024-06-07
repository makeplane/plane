import { FC, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// types
import { IProjectView, TLogoProps } from "@plane/types";
// ui
import { EmojiIconPicker, EmojiIconPickerTypes, PhotoFilterIcon, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ListItem } from "@/components/core/list";
import { ViewListItemAction } from "@/components/views";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
// hooks
import { useProjectView } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem: FC<Props> = observer((props) => {
  const { view } = props;
  // refs
  const parentRef = useRef(null);
  // state
  const [isOpen, setIsOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { isMobile } = usePlatformOS();
  const { updateView } = useProjectView();

  const handleViewLogoUpdate = async (data: TLogoProps) => {
    if (!workspaceSlug || !projectId || !view.id || !data) return;

    updateView(workspaceSlug.toString(), projectId.toString(), view.id.toString(), {
      logo_props: data,
    })
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
                {view?.logo_props?.in_use ? (
                  <Logo logo={view?.logo_props} size={16} type="lucide" />
                ) : (
                  <PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />
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

              handleViewLogoUpdate({
                in_use: val?.type,
                [val?.type]: logoValue,
              }).finally(() => setIsOpen(false));
            }}
            defaultIconColor={
              view?.logo_props?.in_use && view?.logo_props.in_use === "icon" ? view?.logo_props?.icon?.color : undefined
            }
            defaultOpen={
              view?.logo_props?.in_use && view?.logo_props?.in_use === "emoji"
                ? EmojiIconPickerTypes.EMOJI
                : EmojiIconPickerTypes.ICON
            }
          />
        </>
      }
      title={view.name}
      itemLink={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}
      actionableItems={<ViewListItemAction parentRef={parentRef} view={view} />}
      isMobile={isMobile}
      parentRef={parentRef}
      disableLink={isOpen}
    />
  );
});
