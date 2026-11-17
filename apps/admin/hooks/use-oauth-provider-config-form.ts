/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import type { DefaultValues, UseFormReturn } from "react-hook-form";
// plane internal packages
import { setToast } from "@plane/blocks/toast";
import type { IFormattedInstanceConfiguration } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store";

/**
 * Form state and save handler shared by the OAuth provider config forms.
 * On save, the form resets to the values the API returns so it is no longer dirty.
 */
export function useOAuthProviderConfigForm<T extends Partial<IFormattedInstanceConfiguration>>(
  providerName: string,
  defaultValues: DefaultValues<T>
): UseFormReturn<T> & { onSave: (e?: BaseSyntheticEvent) => Promise<void> } {
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const form = useForm<T>({ defaultValues });

  const onSubmit = async (formData: T) => {
    try {
      const response = await updateInstanceConfigurations(formData);
      setToast({
        type: "success",
        title: "Done!",
        message: `Your ${providerName} authentication is configured. You should test it now.`,
      });
      const savedValues = Object.fromEntries(
        Object.keys(formData).map((key) => [key, response.find((item) => item.key === key)?.value])
      );
      form.reset(savedValues as T);
    } catch (err) {
      console.error(err);
    }
  };

  return { ...form, onSave: form.handleSubmit(onSubmit) };
}
