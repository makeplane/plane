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

import { useRef, useState } from "react";
import { useTheme } from "@plane/react-theme";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { PlaneLogo } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { cn } from "@plane/utils";
// assets
import GridBgDark from "@/app/assets/images/grid-bg-dark.svg?url";
import GridBgLight from "@/app/assets/images/grid-bg-light.svg?url";
// plane web imports
import { useIntake } from "@/plane-web/hooks/store/use-intake";
// local imports
import IntakeInfo from "../info";
import IssueForm from "./form";
import FormSuccess from "./success";

type TProps = {
  project: Partial<IProject>;
  anchor: string;
};

export type TFormData = {
  email: string;
  username: string;
  description_html: string;
  name: string;
};

function CreateIssueModal({ project, anchor }: TProps) {
  // state
  const [success, setSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  // hooks
  const { publishIntakeForm } = useIntake();
  const { resolvedTheme } = useTheme();
  // form info
  const methods = useForm<TFormData>({
    defaultValues: { email: "", username: "", description_html: "", name: "" },
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset } = methods;

  // derived
  const gridBgImage = resolvedTheme === "dark" ? GridBgDark : GridBgLight;

  if (!project) return null;

  const onSubmit = async (formData: Partial<TFormData>) => {
    // async request which may result error;
    try {
      if (descriptionEditorRef.current && !descriptionEditorRef.current.isEditorReadyToDiscard()) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Editor is still processing changes. Please wait before proceeding.",
        });
        return;
      }

      const payload: TFormData = {
        name: formData.name || "",
        description_html: formData.description_html || "<p></p>",
        email: formData.email || "",
        username: formData.username || "",
      };

      setFormSubmitting(true);
      await publishIntakeForm(anchor.toString(), payload);
      setSuccess(true);
      setFormSubmitting(false);
      reset();
    } catch (e) {
      // handle your error
      console.log(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "error",
        message: "Something went wrong",
      });
      setFormSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-1 ">
      {!success && <img src={gridBgImage} alt="Grid Background" className="absolute top-0 left-0 w-full h-full " />}
      <div className="flex justify-between pt-6 px-page-x z-10">
        <div className="flex gap-2 items-center">
          <PlaneLogo className="h-6 w-auto text-primary" />
          <div className="text-20 text-primary font-semibold">Plane</div>
          <div className="text-20 text-tertiary font-semibold">Intake</div>
        </div>

        <IntakeInfo />
      </div>
      <div className="flex justify-center w-full h-full items-center overflow-y-scroll">
        {!success ? (
          <div
            className={cn(
              "p-4 rounded-md w-[375px] md:w-[575px] shadow-raised-100 border-[1px] z-[5] border-subtle-1 bg-layer-1",
              {
                "bg-surface-1 border-subtle shadow-raised-100": resolvedTheme === "light",
              }
            )}
          >
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <IssueForm
                  anchor={anchor}
                  project={project}
                  isSubmitting={formSubmitting}
                  descriptionEditorRef={descriptionEditorRef}
                />
              </form>
            </FormProvider>
          </div>
        ) : (
          <FormSuccess onReset={() => setSuccess(false)} />
        )}
      </div>
    </div>
  );
}

export default CreateIssueModal;
