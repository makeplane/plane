import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EmojiIconPicker, EmojiIconPickerTypes } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { Logo } from "@/components/common";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  className?: string;
  page: TPageInstance;
};

export const PageEditorHeaderLogoPicker: React.FC<Props> = observer((props) => {
  const { className, page } = props;
  // states
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  // derived values
  const { logo_props, isContentEditable, updatePageLogo } = page;
  const isLogoSelected = !!logo_props?.in_use;

  return (
    <div
      className={cn(className, "max-h-0 pointer-events-none transition-all ease-linear duration-300", {
        "max-h-[56px] pointer-events-auto": isLogoSelected,
      })}
    >
      <EmojiIconPicker
        isOpen={isLogoPickerOpen}
        handleToggle={(val) => setIsLogoPickerOpen(val)}
        className="flex items-center justify-center"
        buttonClassName="flex items-center justify-center"
        label={
          <div
            className={cn("-ml-[8px] size-[56px] grid place-items-center rounded transition-colors", {
              "hover:bg-custom-background-80": isContentEditable,
            })}
          >
            {isLogoSelected && <Logo logo={logo_props} size={48} type="lucide" />}
          </div>
        }
        onChange={updatePageLogo}
        defaultIconColor={logo_props?.in_use && logo_props.in_use === "icon" ? logo_props?.icon?.color : undefined}
        defaultOpen={
          logo_props?.in_use && logo_props?.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
        }
        disabled={!isContentEditable}
      />
    </div>
  );
});
