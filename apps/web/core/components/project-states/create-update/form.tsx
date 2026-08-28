/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { TwitterPicker } from "react-color";
import { Button } from "@makeplane/propel/components/button";
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import type { IState } from "@plane/types";
import { Popover, TextArea } from "@plane/ui";
type TStateForm = {
  data: Partial<IState>;
  onSubmit: (formData: Partial<IState>) => Promise<{ status: string }>;
  onCancel: () => void;
  buttonDisabled: boolean;
  buttonTitle: string;
};

function PopoverButton({ color }: { color?: string }) {
  return (
    <div
      className="group inline-flex h-5 w-5 items-center rounded-sm text-14 font-medium transition-all focus:outline-none"
      style={{
        backgroundColor: color ?? "black",
      }}
    />
  );
}

export function StateForm(props: TStateForm) {
  const { data, onSubmit, onCancel, buttonDisabled, buttonTitle } = props;
  // states
  const [formData, setFromData] = useState<Partial<IState> | undefined>(undefined);
  const [errors, setErrors] = useState<Partial<Record<keyof IState, string>> | undefined>(undefined);

  useEffect(() => {
    if (data && !formData) setFromData(data);
  }, [data, formData]);

  const handleFormData = <T extends keyof IState>(key: T, value: IState[T]) => {
    setFromData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const formSubmit = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();

    const name = formData?.name || undefined;
    if (!formData || !name) {
      let currentErrors: Partial<Record<keyof IState, string>> = {};
      if (!name) currentErrors = { ...currentErrors, name: "Name is required" };
      setErrors(currentErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <div className="relative flex space-x-2 rounded-sm bg-surface-1 p-3">
      {/* color */}
      <div className="mt-2 h-full flex-shrink-0">
        <Popover button={<PopoverButton color={formData?.color} />} panelClassName="mt-4 -ml-3">
          <TwitterPicker color={formData?.color} onChange={(value) => handleFormData("color", value.hex)} />
        </Popover>
      </div>

      <div className="w-full space-y-2">
        {/* title */}
        <Field name="name" invalid={(errors && Boolean(errors.name)) || false}>
          <InputGroup size="2xl">
            <Input
              size="2xl"
              id="name"
              type="text"
              name="name"
              placeholder="Name"
              value={formData?.name}
              onChange={(e) => handleFormData("name", e.target.value)}
              maxLength={100}
              autoFocus
            />
          </InputGroup>
        </Field>

        {/* description */}
        <TextArea
          id="description"
          name="description"
          placeholder="Describe this state for your members."
          value={formData?.description}
          onChange={(e) => handleFormData("description", e.target.value)}
          hasError={(errors && Boolean(errors.description)) || false}
          className="min-h-14 w-full resize-none text-13"
        />

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={buttonTitle}
            onClick={formSubmit}
            disabled={buttonDisabled}
          />
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label="Cancel"
            type="button"
            disabled={buttonDisabled}
            onClick={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
