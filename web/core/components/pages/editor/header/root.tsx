import { useState } from "react";
import { observer } from "mobx-react";
import { SmilePlus } from "lucide-react";
// plane imports
import { EmojiIconPicker, EmojiIconPickerTypes } from "@plane/ui";
import { cn } from "@plane/utils";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageEditorHeaderLogoPicker } from "./logo-picker";

type Props = {
  page: TPageInstance;
};

export const PageEditorHeaderRoot: React.FC<Props> = observer((props) => {
  const { page } = props;
  // states
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  // derived values
  const { isContentEditable, logo_props, name, updatePageLogo } = page;
  const isLogoSelected = !!logo_props?.in_use;
  const isTitleEmpty = !name || name.trim() === "";

  return (
    <>
      <div className="h-[48px] flex items-end text-left">
        {!isLogoSelected && (
          <div
            className={cn("opacity-0 group-hover/page-header:opacity-100 transition-all duration-200", {
              "opacity-100": isTitleEmpty,
            })}
          >
            <EmojiIconPicker
              isOpen={isLogoPickerOpen}
              handleToggle={(val) => setIsLogoPickerOpen(val)}
              className="flex items-center justify-center"
              buttonClassName="flex items-center justify-center"
              label={
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 p-1 rounded font-medium text-sm hover:bg-custom-background-80 text-custom-text-300 outline-none transition-colors",
                    {
                      "bg-custom-background-80": isLogoPickerOpen,
                    }
                  )}
                >
                  <SmilePlus className="flex-shrink-0 size-4" />
                  Icon
                </button>
              }
              onChange={updatePageLogo}
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
        )}
      </div>
      <PageEditorHeaderLogoPicker className="flex-shrink-0 w-full mt-2 flex" page={page} />
    </>
  );
});
