"use client";

import React from "react";
// plane helpers
import { convertHexEmojiToDecimal } from "@plane/helpers";
// plane types
import { TLogoProps } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// plane ui
import { EmojiIconPickerTypes, ProjectLogoPickerDropdown } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// helpers
import { cn } from "@/helpers/common.helper";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type Props = {
  buttonClassName?: string;
  disabled?: boolean;
  handleToggle: (val: boolean) => void;
  isOpen: boolean;
  logoSize?: number;
  onChange: (val: TLogoProps) => void;
  value: TLogoProps;
  workspaceSlug: string;
};

export const ProjectLogoPicker: React.FC<Props> = (props) => {
  const {
    buttonClassName,
    disabled = false,
    handleToggle,
    isOpen,
    logoSize = 20,
    onChange,
    value,
    workspaceSlug,
  } = props;

  return (
    <ProjectLogoPickerDropdown
      disabled={disabled}
      isOpen={isOpen}
      handleToggle={handleToggle}
      buttonClassName={cn("flex-shrink-0 grid place-items-center", buttonClassName)}
      label={<Logo logo={value} size={logoSize} />}
      onChange={(val) => {
        let logoValue: Omit<TLogoProps, "in_use"> = {};

        if (val?.type === EmojiIconPickerTypes.EMOJI) {
          logoValue = {
            emoji: {
              value: convertHexEmojiToDecimal(val.value.unified),
              url: val.value.imageUrl,
            },
          };
        } else if (val?.type === EmojiIconPickerTypes.ICON) {
          logoValue = {
            icon: val.value,
          };
        } else if (val?.type === EmojiIconPickerTypes.IMAGE) {
          logoValue = {
            image: {
              url: val.value,
            },
          };
        }

        onChange({
          in_use: val?.type,
          ...logoValue,
        });
        handleToggle(false);
      }}
      defaultIconColor={value.in_use === "icon" ? value.icon?.color : undefined}
      defaultOpen={value.in_use === "icon" ? EmojiIconPickerTypes.ICON : EmojiIconPickerTypes.EMOJI}
      uploadFile={async (file) => {
        const { asset_url } = await fileService.uploadWorkspaceAsset(
          workspaceSlug,
          {
            entity_identifier: "",
            entity_type: EFileAssetType.PROJECT_LOGO,
          },
          file
        );
        return asset_url;
      }}
    />
  );
};
