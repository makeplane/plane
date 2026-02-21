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

import { useEffect, useState, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { ChevronDownIcon } from "lucide-react";
// ui
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
import { Input } from "@plane/ui";
// types
import type { ScriptFunction, ScriptFunctionFormData, FunctionParameter, FunctionCategory } from "@plane/types";
// hooks
import { useFunctions } from "@/hooks/store/runners/use-functions";
// components
import { LazyPlaneSDKCodeEditor } from "@/components/plane-sdk-editor/root";
import { Combobox } from "@plane/propel/combobox";
import { ParametersField } from "./parameters-field";

type Props = {
  functionData?: ScriptFunction;
  headerAction?: React.ReactNode;
  handleCancel: () => void;
  callBack?: (functionId: string | null) => void;
};

type FormData = ScriptFunctionFormData & {
  parameters: (FunctionParameter & { id?: string })[];
};

const DEFAULT_FORM_VALUES: FormData = {
  name: "",
  description: "",
  category: "custom",
  parameters: [],
  return_type: "{ success: boolean }",
  code: "", // Will be auto-generated when name is entered
  usage_example: "",
};

const CATEGORY_OPTIONS: { value: FunctionCategory; label: string }[] = [
  { value: "http", label: "HTTP" },
  { value: "notifications", label: "Notifications" },
  { value: "data", label: "Data" },
  { value: "utils", label: "Utils" },
  { value: "custom", label: "Custom" },
];

/**
 * Generate a code template for a function with the given name and parameters
 */
const generateCodeTemplate = (name: string, parameters: FunctionParameter[] = []): string => {
  const funcName = name || "myFunction";
  const paramNames =
    parameters.length > 0
      ? parameters
          .map((p) => p.name)
          .filter(Boolean)
          .join(", ")
      : "/* params */";

  return `function ${funcName}({ ${paramNames} }) {
  // Your implementation here

  return { success: true };
}`;
};

/**
 * Check if the code contains a function definition with the expected name
 */
const codeHasFunctionName = (code: string, name: string): boolean => {
  if (!name || !code) return true; // No check needed if either is empty
  // Match: function name( or async function name(
  const pattern = new RegExp(`(async\\s+)?function\\s+${name}\\s*\\(`);
  return pattern.test(code);
};

const functionToFormData = (fn: ScriptFunction): FormData => ({
  name: fn.name,
  description: fn.description,
  category: fn.category,
  parameters: fn.parameters,
  return_type: fn.return_type,
  code: fn.code,
  usage_example: fn.usage_example || "",
});

export const CreateUpdateFunction = observer(function CreateUpdateFunction(props: Props) {
  const { functionData, headerAction, callBack, handleCancel } = props;
  const { workspaceSlug } = useParams();
  const { createFunction, updateFunction } = useFunctions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track the last auto-generated code to know if user has manually edited
  const lastGeneratedCodeRef = useRef<string>("");
  const isEditMode = Boolean(functionData?.id);
  const isReadOnly = functionData?.is_system;
  const methods = useForm<FormData>({
    defaultValues: functionData ? functionToFormData(functionData) : DEFAULT_FORM_VALUES,
  });

  const {
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = methods;

  const formValues = watch();
  // Handle name change - auto-generate code template if code is empty or matches last generated
  const handleNameChange = useCallback(
    (newName: string, onChange: (value: string) => void) => {
      onChange(newName);

      // Only auto-generate for new functions, not when editing
      if (isEditMode) return;

      const currentCodeValue = methods.getValues("code");
      const isCodeEmpty = !currentCodeValue || currentCodeValue.trim() === "";
      const isCodeUnmodified =
        currentCodeValue === lastGeneratedCodeRef.current || currentCodeValue === DEFAULT_FORM_VALUES.code;

      // Auto-generate code if empty or unmodified
      if (isCodeEmpty || isCodeUnmodified) {
        const params = methods.getValues("parameters") || [];
        const newCode = generateCodeTemplate(newName, params);
        lastGeneratedCodeRef.current = newCode;
        methods.setValue("code", newCode);
      }
    },
    [isEditMode, methods]
  );

  // Auto-generate usage example
  const generateUsageExample = () => {
    const params = formValues.parameters
      .filter((p) => p.name)
      .map((p) => `  ${p.name}: ${p.type === "string" ? '"value"' : p.type === "number" ? "0" : "{}"}`)
      .join(",\n");

    return `const result = await Functions.${formValues.name || "myFunction"}({
${params}
});`;
  };

  const onSubmit = async (formData: FormData) => {
    if (!workspaceSlug || isReadOnly) return;

    setIsSubmitting(true);
    try {
      const payload: ScriptFunctionFormData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        parameters: formData.parameters.map(({ name, type, description, required, defaultValue }) => ({
          name,
          type,
          description,
          required,
          defaultValue,
        })),
        return_type: formData.return_type,
        code: formData.code,
        usage_example: formData.usage_example || generateUsageExample(),
      };

      let result;
      if (functionData?.id) {
        result = await updateFunction(workspaceSlug, functionData.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Function updated successfully",
        });
      } else {
        result = await createFunction(workspaceSlug, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Function created successfully",
        });
      }
      callBack?.(result?.id);
    } catch (error) {
      console.error("Error saving function:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: functionData?.id ? "Failed to update function" : "Failed to create function",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (functionData) {
      reset(functionToFormData(functionData));
    } else {
      reset(DEFAULT_FORM_VALUES);
    }
  }, [functionData, reset]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full" key={functionData?.id}>
        <div className="space-y-6">
          {/* Name and Header Action */}
          <div
            className={cn("space-y-1 flex items-center justify-between w-full", {
              "border-b border-subtle pb-3": headerAction,
            })}
          >
            <div className="flex flex-col gap-1 w-full">
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Function name is required",
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="name"
                    type="text"
                    placeholder="functionName"
                    className="w-full inline-block text-h3-medium bg-transparent p-0 border-none text-tertiary m-0 font-mono"
                    hasError={Boolean(errors.name)}
                    value={value}
                    onChange={(e) => handleNameChange(e.target.value, onChange)}
                    ref={ref}
                    readOnly={isReadOnly}
                  />
                )}
              />
              {headerAction}
              {errors.name && <p className="text-danger-primary text-11">{errors.name.message}</p>}

              {/* Description */}
              <Controller
                name="description"
                control={control}
                rules={{ required: "Description is required" }}
                render={({ field }) => (
                  <Input
                    placeholder="Add description"
                    className={cn("w-full text-body-sm-regular border-none p-0 rounded-none bg-transparent", {
                      "text-tertiary": isReadOnly,
                    })}
                    {...field}
                    readOnly={isReadOnly}
                  />
                )}
              />
              {errors.description && <p className="text-danger-primary text-11">{errors.description.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col space-y-2">
            <span className="text-body-xs-medium text-primary">Category</span>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Combobox {...field} value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                  <Combobox.Button
                    className={cn(
                      "flex text-primary justify-between items-center gap-1 rounded-lg h-8 px-2 bg-layer-2 border border-subtle-1 overflow-hidden hover:bg-surface-1 hover:shadow-raised-100 shrink-0 m-0",
                      {
                        "text-tertiary": isReadOnly,
                      }
                    )}
                  >
                    <span className="capitalize text-body-xs-medium truncate ">{field.value}</span>
                    <ChevronDownIcon className="size-4" />
                  </Combobox.Button>
                  <Combobox.Options className="max-h-[70vh] overflow-y-auto" maxHeight="lg">
                    {CATEGORY_OPTIONS.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        className="capitalize text-13 text-secondary font-medium flex w-full items-center gap-2 data-[highlighted]:bg-layer-transparent-hover"
                      >
                        <span className="text-13 truncate">{option.label}</span>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Combobox>
              )}
            />
          </div>

          {/* Parameters */}
          <ParametersField readOnly={isReadOnly} />

          {/* Return Type */}
          <div className="flex flex-col space-y-2">
            <span className="text-body-xs-medium text-primary">Return Type</span>
            <Controller
              name="return_type"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Promise<{ success: boolean }>"
                  className={cn("w-full h-8 text-body-sm-regular border border-subtle rounded-lg font-mono", {
                    "text-tertiary": isReadOnly,
                  })}
                  {...field}
                  readOnly={isReadOnly}
                />
              )}
            />
          </div>

          {/* Code Editor */}
          <div className="flex flex-col space-y-2">
            <span className="text-body-xs-medium text-primary">Function Code</span>
            <Controller
              name="code"
              control={control}
              rules={{
                required: "Code is required",
                validate: (value) => {
                  const name = methods.getValues("name");
                  if (name && !codeHasFunctionName(value, name)) {
                    return `The code must define a function named ${name}. Update your code to: function ${name}(...)`;
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <LazyPlaneSDKCodeEditor
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={functionData?.is_system}
                />
              )}
            />
            {errors.code && <p className="text-danger-primary text-11">{errors.code.message}</p>}
          </div>

          {/* Usage Example Preview */}
          <div className="flex flex-col space-y-2">
            <span className="text-body-xs-medium text-primary">Usage Example (auto-generated)</span>
            <div className="bg-layer-2 border border-subtle rounded-lg p-2 text-body-sm-regular text-secondary">
              {generateUsageExample()}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {!isReadOnly && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              {functionData?.id ? "Update" : "Create"} Function
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
});
