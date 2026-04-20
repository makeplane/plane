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

import { observer } from "mobx-react";
import type { FieldErrors } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import type { PermissionScheme } from "@plane/types";
import { TextArea } from "@plane/ui";

type Props = {
  description: string;
  errors: FieldErrors<PermissionScheme>;
  isEditing: boolean;
  name: string;
  onDescriptionChange: (description: string) => void;
  onNameChange: (name: string) => void;
};

export const SchemeBasicInformation = observer(function SchemeBasicInformation(props: Props) {
  const { description, errors, isEditing, name, onDescriptionChange, onNameChange } = props;
  // translation
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-9 gap-12 py-7">
      <div className="col-span-4 flex flex-col gap-y-1.5">
        <h6 className="text-h6-medium">
          {t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_information_title")}
        </h6>
        <p className="text-body-xs-regular text-secondary">
          {t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_information_description")}
        </p>
      </div>
      <div className="col-span-5 flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <p className="text-body-xs-medium text-tertiary">
            {t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_name")}
            {isEditing && <span className="text-danger-primary">*</span>}
          </p>
          {isEditing ? (
            <div className="flex flex-col gap-y-1">
              <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_name_placeholder")}
                hasError={!!errors.name}
              />
              {errors.name && (
                <p className="text-danger-primary text-caption-md-regular">
                  {t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_name_error")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-body-sm-regular wrap-break-word">{name}</p>
          )}
        </div>
        {(isEditing || description) && (
          <div className="flex flex-col gap-y-2">
            <p className="text-body-xs-medium text-tertiary">
              {t("workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_description")}
            </p>
            {isEditing ? (
              <TextArea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="text-body-xs-regular"
                placeholder={t(
                  "workspace_settings.settings.roles_and_schemes.scheme_detail.scheme_description_placeholder"
                )}
                hasError={!!errors.description}
              />
            ) : (
              <p className="text-body-sm-regular wrap-break-word whitespace-pre-line">{description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
