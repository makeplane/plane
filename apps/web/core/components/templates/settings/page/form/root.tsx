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
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TPageTemplateForm, PartialDeep } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME } from "@/components/templates/settings/common";
import { TemplateDetails } from "@/components/templates/settings/common/form/template-details";
// local imports
import { PageTemplatePageDetails } from "./page-details";

export enum EPageFormOperation {
  CREATE = "create",
  UPDATE = "update",
}

export type TPageTemplateFormSubmitData = {
  data: TPageTemplateForm;
};

type Props = {
  workspaceSlug: string;
  currentLevel: ETemplateLevel;
  operation: EPageFormOperation;
  preloadedData?: PartialDeep<TPageTemplateForm>;
  handleFormCancel: () => void;
  handleFormSubmit: (data: TPageTemplateFormSubmitData) => Promise<void>;
};

const DEFAULT_PAGE_TEMPLATE_FORM_VALUES: TPageTemplateForm = {
  template: {
    id: "",
    name: "",
    short_description: "",
  },
  page: {
    id: undefined,
    name: "",
    description_html: "",
    logo_props: undefined,
    project: undefined,
  },
};

export const PageTemplateFormRoot = observer(function PageTemplateFormRoot(props: Props) {
  const { workspaceSlug, operation, preloadedData, handleFormCancel, handleFormSubmit } = props;
  // plane hooks
  const { t } = useTranslation();
  // form state
  const defaultValueForReset = useMemo(
    () =>
      preloadedData ? merge({}, DEFAULT_PAGE_TEMPLATE_FORM_VALUES, preloadedData) : DEFAULT_PAGE_TEMPLATE_FORM_VALUES,
    [preloadedData]
  );
  const methods = useForm<TPageTemplateForm>({
    defaultValues: defaultValueForReset,
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: TPageTemplateForm) => {
    await handleFormSubmit({ data });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Template Section */}
        <div className="space-y-4 w-full max-w-4xl py-page-y">
          <TemplateDetails
            fieldPaths={{
              name: "template.name",
              shortDescription: "template.short_description",
            }}
            validation={{
              name: {
                required: t("templates.settings.form.page.template.name.validation.required"),
                maxLength: t("templates.settings.form.page.template.name.validation.maxLength"),
              },
            }}
            placeholders={{
              name: t("templates.settings.form.page.template.name.placeholder"),
              shortDescription: t("templates.settings.form.page.template.description.placeholder"),
            }}
          />
        </div>
        {/* Page Section */}
        <div className="size-full">
          <div className="w-full max-w-4xl">
            <PageTemplatePageDetails workspaceSlug={workspaceSlug} templateId={preloadedData?.template?.id} />
            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-8 mt-8 border-t border-subtle">
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" className={cn(COMMON_BUTTON_CLASS_NAME)} onClick={handleFormCancel}>
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" type="submit" className={cn("shadow-sm")} loading={isSubmitting}>
                  {isSubmitting
                    ? t("common.confirming")
                    : operation === EPageFormOperation.CREATE
                      ? t("templates.settings.form.page.button.create")
                      : t("templates.settings.form.page.button.update")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
});
