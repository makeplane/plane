/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IProject, IWorkspace } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// components
import { CoverImage } from "@/components/common/cover-image";
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
// hooks
import { DEFAULT_COVER_IMAGE_URL } from "@/helpers/cover-image.helper";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import type { TProject } from "@/types";
import { Tooltip } from "@plane/propel/tooltip";

type THeroSection = {
  project: TProject;
  workspaceSlug: string;
};

export const HeroSection = observer(function HeroSection(props: THeroSection) {
  const { project, workspaceSlug } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { allowPermissions } = useUserPermissions();
  const { updateProject } = useProject();
  // form info
  const { handleSubmit, control, getValues } = useForm<IProject>({
    defaultValues: {
      ...project,
      workspace: (project.workspace as IWorkspace).id,
    },
  });

  // derived values
  const isAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project.id.toString()
  );

  const handleUpdateChange = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !project) return;
    return updateProject(workspaceSlug.toString(), project.id, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project updated successfully",
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Project could not be updated. Please try again.",
        });
      });
  };
  const onSubmit = async () => {
    if (!workspaceSlug) return;
    const payload: Partial<IProject> = {
      logo_props: getValues<"logo_props">("logo_props"),
    };
    handleUpdateChange(payload);
  };

  const handleCoverChange = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !project) return;
    if (payload.cover_image_url?.startsWith("http")) {
      payload.cover_image = payload.cover_image_url;
      payload.cover_image_asset = null;
    }
    return updateProject(workspaceSlug.toString(), project.id, payload);
  };

  return (
    <div>
      <div className="relative h-[118px] w-full ">
        <CoverImage src={project.cover_image_url} alt={project.name} className="absolute left-0 top-0 h-full w-full" />
        {isAdmin && (
          <div className="absolute right-4 top-4">
            <ImagePickerPopover
              label="Change cover"
              control={control}
              onChange={(data) => {
                if (data === project.cover_image_url) return;
                handleCoverChange({ cover_image_url: data });
              }}
              value={project.cover_image_url ?? DEFAULT_COVER_IMAGE_URL}
              disabled={!isAdmin}
              projectId={project.id}
            />
          </div>
        )}
      </div>
      <div className="relative px-10 pt-page-y mt-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="absolute -top-[27px] h-10 w-10 flex-shrink-0 grid place-items-center rounded-sm bg-layer-1"
        >
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
              <EmojiPicker
                iconType="material"
                closeOnSelect={false}
                isOpen={isOpen}
                handleToggle={(val: boolean) => setIsOpen(val)}
                className="flex items-center justify-center"
                buttonClassName="flex flex-shrink-0 items-center justify-center rounded-lg bg-white/10"
                label={<Logo logo={value} size={28} />}
                onChange={(val) => {
                  let logoValue = {};

                  if (val?.type === "emoji")
                    logoValue = {
                      value: val.value,
                    };
                  else if (val?.type === "icon") logoValue = val.value;

                  onChange({
                    in_use: val?.type,
                    [val?.type]: logoValue,
                  });
                  onSubmit();
                  setIsOpen(false);
                }}
                defaultIconColor={value?.in_use && value.in_use === "icon" ? value?.icon?.color : undefined}
                defaultOpen={
                  value.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                }
                disabled={!isAdmin}
              />
            )}
          />
        </form>
        <Tooltip tooltipContent={project.name} position="top">
          <div className="font-bold text-18 pt-5 truncate">{project.name}</div>
        </Tooltip>
      </div>
    </div>
  );
});
