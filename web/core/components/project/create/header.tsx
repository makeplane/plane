import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { X } from "lucide-react";
// plane types
import { IProject } from "@plane/types";
// plane ui
import { CustomEmojiIconPicker, EmojiIconPickerTypes, Logo } from "@plane/ui";
// components
import { ImagePickerPopover } from "@/components/core";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getFileURL } from "@/helpers/file.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
};
const ProjectCreateHeader: React.FC<Props> = (props) => {
  const { handleClose, isMobile = false } = props;
  const { watch, control } = useFormContext<IProject>();
  // derived values
  const coverImage = watch("cover_image_url");

  const [isOpen, setIsOpen] = useState(false);
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="group relative h-44 w-full rounded-lg bg-custom-background-80">
      {coverImage && (
        <img
          src={getFileURL(coverImage)}
          className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
          alt="Project cover image"
        />
      )}

      <div className="absolute right-2 top-2 p-2">
        <button data-posthog="PROJECT_MODAL_CLOSE" type="button" onClick={handleClose} tabIndex={getIndex("close")}>
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="absolute bottom-2 right-2">
        <Controller
          name="cover_image_url"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ImagePickerPopover
              label="Change Cover"
              onChange={onChange}
              control={control}
              value={value}
              tabIndex={getIndex("cover_image")}
            />
          )}
        />
      </div>
      <div className="absolute -bottom-[22px] left-3">
        <Controller
          name="logo_props"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CustomEmojiIconPicker
              isOpen={isOpen}
              handleToggle={(val: boolean) => setIsOpen(val)}
              className="flex items-center justify-center"
              buttonClassName="flex items-center justify-center"
              label={
                <span className="grid h-11 w-11 place-items-center rounded-md bg-custom-background-80">
                  <Logo logo={value} size={20} />
                </span>
              }
              onChange={(val: any) => {
                let logoValue = {};

                if (val?.type === "emoji")
                  logoValue = {
                    value: convertHexEmojiToDecimal(val.value.unified),
                    url: val.value.imageUrl,
                  };
                else if (val?.type === "icon") logoValue = val.value;

                onChange({
                  in_use: val?.type,
                  [val?.type]: logoValue,
                });
                setIsOpen(false);
              }}
              defaultIconColor={value.in_use && value.in_use === "icon" ? value.icon?.color : undefined}
              defaultOpen={
                value.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
              }
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProjectCreateHeader;
