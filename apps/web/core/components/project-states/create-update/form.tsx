import { useEffect, useState } from "react";
import { TwitterPicker } from "react-color";
import { Button } from "@plane/propel/button";
import type { IState } from "@plane/types";
import { Popover, Input, TextArea } from "@plane/ui";

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
      className="group inline-flex items-center text-14 font-medium focus:outline-none h-5 w-5 rounded-sm transition-all"
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
    <div className="relative flex space-x-2 bg-surface-1 p-3 rounded-sm">
      {/* color */}
      <div className="flex-shrink-0 h-full mt-2">
        <Popover button={<PopoverButton color={formData?.color} />} panelClassName="mt-4 -ml-3">
          <TwitterPicker color={formData?.color} onChange={(value) => handleFormData("color", value.hex)} />
        </Popover>
      </div>

      <div className="w-full space-y-2">
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
        <TextArea
          id="description"
          name="description"
          placeholder="Describe this state for your members."
          value={formData?.description}
          onChange={(e) => handleFormData("description", e.target.value)}
          hasError={(errors && Boolean(errors.description)) || false}
          className="w-full text-13 min-h-14 resize-none"
        />

        <div className="flex space-x-2 items-center">
          <Button onClick={formSubmit} variant="primary" size="lg" disabled={buttonDisabled}>
            {buttonTitle}
          </Button>
          <Button type="button" variant="secondary" size="lg" disabled={buttonDisabled} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
