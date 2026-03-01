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

import { useMemo } from "react";
import { merge } from "lodash-es";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TBaseTemplateWithData, TPublishTemplateFormWithData } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME } from "@/components/templates/settings/common";
import type { IBaseTemplateInstance } from "@/store/templates";
// local imports
import { TemplateAdditionalDetails } from "./additional-details";
import { TemplateBasicDetails } from "./basic-details";

type TPublishTemplateFormRootProps<T extends TBaseTemplateWithData> = {
  templateInstance: IBaseTemplateInstance<T>;
  handleFormCancel: () => void;
  handleFormSubmit: (data: TPublishTemplateFormWithData) => Promise<void>;
};

const DEFAULT_PUBLISH_TEMPLATE_FORM_VALUES: TPublishTemplateFormWithData = {
  id: "",
  name: "",
  short_description: "",
  description_html: "",
  categories: [],
  keywords: [],
  company_name: "",
  contact_email: "",
  privacy_policy_url: "",
  terms_of_service_url: "",
  cover_image_asset: "",
  cover_image_url: "",
  attachments: [],
  attachments_urls: [],
  website: "",
};

export const PublishTemplateFormRoot = observer(function PublishTemplateFormRoot<T extends TBaseTemplateWithData>(
  props: TPublishTemplateFormRootProps<T>
) {
  const { templateInstance, handleFormCancel, handleFormSubmit } = props;
  // plane hooks
  const { t } = useTranslation();
  // form state
  const defaultValueForReset = useMemo(
    () => merge({}, DEFAULT_PUBLISH_TEMPLATE_FORM_VALUES, templateInstance.asPublishableJSON),
    [templateInstance.asPublishableJSON]
  );
  const methods = useForm<TPublishTemplateFormWithData>({
    defaultValues: defaultValueForReset,
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <FormProvider {...methods}>
      <form className="space-y-5 py-6" onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Template Basic Details */}
        <TemplateBasicDetails templateInstance={templateInstance} />
        {/* Template Additional Details */}
        <TemplateAdditionalDetails />
        {/* Form Actions */}
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" className={cn(COMMON_BUTTON_CLASS_NAME)} onClick={handleFormCancel}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" type="submit" className={cn("shadow-sm")} loading={isSubmitting}>
              {isSubmitting ? t("common.confirming") : t("common.save_changes")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
});
