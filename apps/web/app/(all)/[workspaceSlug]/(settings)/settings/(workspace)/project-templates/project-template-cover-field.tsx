/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { CoverImage } from "@/components/common/cover-image";
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
import type { TProjectTemplateFormFields } from "./project-template-form.types";

type TProps = {
  control: Control<TProjectTemplateFormFields>;
  workspaceSlug: string;
};

export const ProjectTemplateCoverField = ({ control, workspaceSlug }: TProps) => {
  const { t } = useTranslation();
  const coverImageUrl = useWatch({ control, name: "coverImageUrl" });

  return (
    <div>
      <label className="text-12 text-tertiary">
        {t("workspace_settings.settings.project_templates.form.default_cover_image")}
      </label>
      <div className="group relative mt-2 h-36 w-full rounded-lg border border-subtle">
        <CoverImage
          src={coverImageUrl}
          alt={t("project_cover_image_alt")}
          className="absolute top-0 left-0 h-full w-full rounded-lg object-cover"
        />
        <div className="absolute right-2 bottom-2 z-[60]">
          <Controller
            name="coverImageUrl"
            control={control}
            render={({ field: { value, onChange } }) => (
              <ImagePickerPopover
                label={t("change_cover")}
                value={value ?? null}
                onChange={onChange}
                control={control as unknown as Control<{ search: string }>}
                workspaceSlug={workspaceSlug}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
