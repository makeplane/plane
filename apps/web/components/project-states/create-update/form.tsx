/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { InputField } from "@makeplane/propel/components/input-field";
import { Popover, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { Button } from "@makeplane/propel/components/button";
import { ColorSwatchPicker } from "@plane/blocks/common";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/blocks/icons";
import type { IState, TStateGroups } from "@plane/types";

type TStateForm = {
  data: Partial<IState>;
  onSubmit: (formData: Partial<IState>) => Promise<{ status: string }>;
  onCancel: () => void;
  buttonDisabled: boolean;
  buttonTitle: string;
};

function PopoverButton({ color, group }: { color?: string; group?: TStateGroups }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle-1">
      {group ? (
        <StateGroupIcon stateGroup={group} color={color ?? "black"} size="lg" />
      ) : (
        <span className="size-4 rounded-sm transition-colors" style={{ backgroundColor: color ?? "black" }} />
      )}
    </span>
  );
}

export function StateForm(props: TStateForm) {
  const { data, onSubmit, onCancel, buttonDisabled, buttonTitle } = props;
  // plane hooks
  const { t } = useTranslation();
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
    <div className="relative rounded-lg border border-subtle bg-layer-2">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2.5">
          {/* color */}
          <div className="shrink-0">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong"
                    aria-label={t("aria_labels.color_picker.open")}
                  >
                    <PopoverButton color={formData?.color} group={data?.group} />
                  </button>
                }
              />
              <PopoverContent variant="rich" side="bottom" align="start">
                <ColorSwatchPicker value={formData?.color} onChange={(hex) => handleFormData("color", hex)} />
              </PopoverContent>
            </Popover>
          </div>
          {/* title */}
          <div className="min-w-0 flex-1">
            <InputField
              size="lg"
              orientation="vertical"
              id="name"
              type="text"
              name="name"
              aria-label={t("name")}
              placeholder="Name"
              value={formData?.name}
              onChange={(e) => handleFormData("name", e.target.value)}
              maxLength={100}
              autoFocus
              error={errors?.name || undefined}
            />
          </div>
        </div>

        {/* description */}
        <TextAreaField
          size="lg"
          resize="none"
          autoResize
          maxRows={8}
          id="description"
          name="description"
          aria-label={t("description")}
          placeholder="Describe this state for your members."
          value={formData?.description ?? ""}
          onChange={(e) => handleFormData("description", e.target.value)}
          error={errors?.description || undefined}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-subtle-1 px-4 py-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          stretch="auto"
          label="Cancel"
          disabled={buttonDisabled}
          onClick={onCancel}
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          label={buttonTitle}
          onClick={formSubmit}
          disabled={buttonDisabled}
        />
      </div>
    </div>
  );
}
