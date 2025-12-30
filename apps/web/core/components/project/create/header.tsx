import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon } from "@plane/propel/icons";
// plane types
import type { IProject } from "@plane/types";
// plane ui
import { getTabIndex } from "@plane/utils";
// components
import { CoverImage } from "@/components/common/cover-image";
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
// plane web imports
import { ProjectTemplateSelect } from "@/plane-web/components/projects/create/template-select";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
  handleFormOnChange?: () => void;
  isClosable?: boolean;
  handleTemplateSelect?: () => void;
  showActionButtons?: boolean;
};

function ProjectCreateHeader(props: Props) {
  const {
    handleClose,
    isMobile = false,
    handleFormOnChange,
    isClosable = true,
    handleTemplateSelect,
    showActionButtons = true,
  } = props;
  const { watch, control, setValue } = useFormContext<IProject>();
  const { t } = useTranslation();
  // derived values
  const coverImage = watch("cover_image_url");

  const [isOpen, setIsOpen] = useState(false);
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="group relative h-44 w-full rounded-lg">
      <CoverImage
        src={coverImage}
        alt={t("project_cover_image_alt")}
        className="absolute left-0 top-0 h-full w-full rounded-lg"
      />
      {showActionButtons && (
        <div className="absolute left-2.5 top-2.5">
          <ProjectTemplateSelect onClick={handleTemplateSelect} />
        </div>
      )}
      {isClosable && (
        <div className="absolute right-2 top-2 p-2">
          <button type="button" onClick={handleClose} tabIndex={getIndex("close")}>
            <CloseIcon className="h-5 w-5 text-on-color" />
          </button>
        </div>
      )}
      <div className="absolute bottom-2 right-2">
        <Controller
          name="cover_image_url"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ImagePickerPopover
              label={t("change_cover")}
              onChange={(data) => {
                onChange(data);
                handleFormOnChange?.();
              }}
              control={control}
              value={value ?? null}
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
            <EmojiPicker
              iconType="material"
              isOpen={isOpen}
              handleToggle={(val: boolean) => setIsOpen(val)}
              className="flex items-center justify-center"
              buttonClassName="flex items-center justify-center"
              label={
                <span className="grid h-11 w-11 place-items-center bg-layer-2 rounded-md border border-subtle">
                  <Logo logo={value} size={20} />
                </span>
              }
              onChange={(val: any) => {
                let logoValue = {};

                if (val?.type === "emoji")
                  logoValue = {
                    value: val.value,
                  };
                else if (val?.type === "icon") logoValue = val.value;

                const newLogoProps = {
                  in_use: val?.type,
                  [val?.type]: logoValue,
                };
                setValue("logo_props", newLogoProps, {
                  shouldDirty: true,
                });
                onChange(newLogoProps);
                handleFormOnChange?.();
                setIsOpen(false);
              }}
              defaultIconColor={value?.in_use && value.in_use === "icon" ? value.icon?.color : undefined}
              defaultOpen={
                value?.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
              }
            />
          )}
        />
      </div>
    </div>
  );
}

export default ProjectCreateHeader;
