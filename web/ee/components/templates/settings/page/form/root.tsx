"use client";

import React, { useMemo } from "react";
import merge from "lodash/merge";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TPageTemplateForm, PartialDeep } from "@plane/types";
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
// local imports
import { PageTemplatePageDetails } from "./page-details";
import { TemplateDetails } from "./template-details";

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

export const PageTemplateFormRoot: React.FC<Props> = observer((props) => {
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
        <div className="space-y-4 w-full max-w-4xl px-page-x py-page-y md:p-9 mx-auto">
          <TemplateDetails />
        </div>
        {/* Page Section */}
        <div className="bg-custom-background-90/40 size-full">
          <div className="w-full max-w-4xl px-page-x py-page-y md:p-9 mx-auto">
            <PageTemplatePageDetails workspaceSlug={workspaceSlug} templateId={preloadedData?.template?.id} />
            {/* Form Actions */}
            <div className="flex items-center justify-between gap-2 pt-8 mt-8 border-t border-custom-border-200">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className={cn(COMMON_BUTTON_CLASS_NAME)}
                  onClick={handleFormCancel}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" type="submit" size="sm" className={cn("shadow-sm")} loading={isSubmitting}>
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
