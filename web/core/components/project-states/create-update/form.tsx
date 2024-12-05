"use client";

import { FormEvent, FC, useEffect, useState, useMemo } from "react";
import { TwitterPicker } from "react-color";
import { IState } from "@plane/types";
import { Button, Popover, Input } from "@plane/ui";

type TStateForm = {
  data: Partial<IState>;
  onSubmit: (formData: Partial<IState>) => Promise<{ status: string }>;
  onCancel: () => void;
  buttonDisabled: boolean;
  buttonTitle: string;
};

export const StateForm: FC<TStateForm> = (props) => {
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

  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const PopoverButton = useMemo(
    () => (
      <div
        className="group inline-flex items-center text-base font-medium focus:outline-none h-5 w-5 rounded transition-all"
        style={{
          backgroundColor: formData?.color ?? "black",
        }}
      />
    ),
    [formData?.color]
  );

  return (
    <form onSubmit={formSubmit} className="relative flex items-center gap-2">
      {/* color */}
      <div className="flex-shrink-0">
        <Popover button={PopoverButton} panelClassName="mt-4 -ml-3">
          <TwitterPicker color={formData?.color} onChange={(value) => handleFormData("color", value.hex)} />
        </Popover>
      </div>

      {/* title */}
      <Input
        id="name"
        type="text"
        name="name"
        placeholder="Name"
        value={formData?.name}
        onChange={(e) => handleFormData("name", e.target.value)}
        hasError={(errors && Boolean(errors.name)) || false}
        className="w-full"
        maxLength={100}
        autoFocus
      />

      {/* description */}
      <Input
        id="description"
        type="text"
        name="description"
        placeholder="Description"
        value={formData?.description}
        onChange={(e) => handleFormData("description", e.target.value)}
        hasError={(errors && Boolean(errors.description)) || false}
        className="w-full"
      />

      <Button type="button" variant="neutral-primary" size="sm" disabled={buttonDisabled} onClick={onCancel}>
        Cancel
      </Button>

      <Button type="submit" variant="primary" size="sm" disabled={buttonDisabled}>
        {buttonTitle}
      </Button>
    </form>
  );
};
