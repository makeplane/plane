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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { RunnerScript, RunnerScriptFormData } from "@plane/types";
import { cn, Input } from "@plane/ui";
import { useRunners } from "@/hooks/store/runners/use-runners";
import { LazyPlaneSDKCodeEditor } from "@/components/plane-sdk-editor/root";
import { formDataToScriptPayload, scriptToFormData } from "./env-variables-field";
import { VariablesField } from "./variables-field";
import { TestScript } from "./test-script";
import { DEFAULT_SCRIPT_FORM_DATA } from "@plane/constants";
import { ERunnerScriptType } from "@plane/types";
import { SelectScriptType } from "./select-script-type";

type Props = {
  scriptData?: RunnerScript;
  headerAction?: React.ReactNode;
  handleCancel: () => void;
  callBack?: (scriptId: string | null) => void;
};

const DEFAULT_FORM_VALUES: RunnerScriptFormData = DEFAULT_SCRIPT_FORM_DATA[ERunnerScriptType.AUTOMATION];

export const CreateUpdateRunnerScript = observer(function CreateUpdateRunnerScript(props: Props) {
  const { scriptData, headerAction, callBack, handleCancel } = props;
  const { workspaceSlug } = useParams();
  const { createScript, updateScript } = useRunners();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReadOnly = scriptData?.is_system;

  const methods = useForm<RunnerScriptFormData>({
    defaultValues: scriptData ? scriptToFormData(scriptData) : DEFAULT_FORM_VALUES,
  });

  const {
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = methods;
  const formValues = watch();

  const onSubmit = async (formData: RunnerScriptFormData) => {
    if (!workspaceSlug || isReadOnly) return;
    setIsSubmitting(true);
    try {
      const payload = formDataToScriptPayload(formData);
      let result;
      if (scriptData?.id) {
        result = await updateScript(workspaceSlug, scriptData.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Runner script updated successfully",
        });
      } else {
        result = await createScript(workspaceSlug, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Runner script created successfully",
        });
      }
      callBack?.(result?.id);
    } catch (error) {
      console.error("Error saving runner script:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: scriptData?.id ? "Failed to update runner script" : "Failed to create runner script",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScriptTypeChange = (value: ERunnerScriptType) => {
    // set the default values for the script type
    reset(DEFAULT_SCRIPT_FORM_DATA[value]);
  };

  useEffect(() => {
    if (scriptData) {
      reset(scriptToFormData(scriptData));
    } else {
      reset(DEFAULT_FORM_VALUES);
    }
  }, [scriptData, reset]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6 w-full" key={scriptData?.id}>
        <div className="space-y-3">
          {/* Name */}
          <div
            className={cn("space-y-1 flex gap-2 items-center justify-between mb-6", {
              "border-b border-subtle pb-3": headerAction,
            })}
          >
            <Controller
              name="name"
              control={control}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="name"
                  type="text"
                  placeholder="Add title"
                  className={"w-full inline-block text-h3-medium bg-transparent p-0 border-none text-tertiary m-0"}
                  hasError={Boolean(errors.name)}
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  readOnly={isReadOnly}
                />
              )}
            />
            {headerAction}
          </div>

          {/* Script Type */}
          <div className="flex justify-between flex-col gap-1">
            <div className="text-body-xs-medium text-primary">Script Type</div>
            <SelectScriptType onScriptTypeChange={handleScriptTypeChange} />
          </div>
          {/* Variables */}
          <VariablesField readOnly={isReadOnly} />

          {/* Code Editor */}
          <Controller
            name="code"
            control={control}
            rules={{ required: "Code is required" }}
            render={({ field }) => (
              <LazyPlaneSDKCodeEditor
                value={field.value}
                onChange={field.onChange}
                allowFunctionBrowser
                readOnly={isReadOnly}
              />
            )}
          />
          {errors.code && <p className="text-danger-primary text-11">{errors.code.message}</p>}

          {/* Test Script */}
          <TestScript workspaceSlug={workspaceSlug || ""} config={formValues} />
        </div>

        {/* Form Actions */}
        {!isReadOnly && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              Save
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
});
