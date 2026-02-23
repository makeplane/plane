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

import preview from "#.storybook/preview";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import type { TIssueProperty } from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
import { TextInput } from "./text-input";

const meta = preview.type<{ parameters: { form: UseFormProps } }>().meta({
  component: TextInput,
  parameters: {
    layout: "centered",
    form: {},
  },
  args: {
    property: {
      id: "notes",
      name: "notes",
      display_name: "Notes",
      description: undefined,
      is_required: false,
      is_multi: undefined,
      logo_props: undefined,
      sort_order: undefined,
      relation_type: null,
      default_value: undefined,
      is_active: true,
      issue_type: undefined,
      created_at: undefined,
      created_by: undefined,
      updated_at: undefined,
      updated_by: undefined,
      settings: undefined,
      property_type: EIssuePropertyType.TEXT,
    } satisfies TIssueProperty<EIssuePropertyType.TEXT>,
  },
  decorators: [
    (Story, { parameters }: { parameters: { form?: UseFormProps } }) => {
      const { form } = parameters;
      const methods = useForm(form);
      return (
        <FormProvider {...methods}>
          <Story />
        </FormProvider>
      );
    },
  ],
});

export const Default = meta.story({});

export const MultiLine = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      settings: { display_format: "multi-line" },
    },
  },
});

export const Required = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      is_required: true,
    },
    required: true,
  },
});

export const PreviewMode = meta.story({
  args: {
    isPreview: true,
  },
  parameters: {
    form: { defaultValues: { property_notes: "Some text" } },
  },
});

export const WithDescription = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      description: "Add your notes here",
    },
  },
});
