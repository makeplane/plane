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
import type { TIssueProperty, TIssuePropertyOption } from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
import { OptionSelect } from "./option-select";

const threeOptions: TIssuePropertyOption[] = [
  {
    id: "red",
    name: "Red",
    is_active: true,
    sort_order: 1,
    property: "color",
    description: undefined,
    logo_props: undefined,
    parent: undefined,
    is_default: undefined,
    created_at: undefined,
    created_by: undefined,
    updated_at: undefined,
    updated_by: undefined,
  },
  {
    id: "blue",
    name: "Blue",
    is_active: true,
    sort_order: 2,
    property: "color",
    description: undefined,
    logo_props: undefined,
    parent: undefined,
    is_default: undefined,
    created_at: undefined,
    created_by: undefined,
    updated_at: undefined,
    updated_by: undefined,
  },
  {
    id: "green",
    name: "Green",
    is_active: true,
    sort_order: 3,
    property: "color",
    description: undefined,
    logo_props: undefined,
    parent: undefined,
    is_default: undefined,
    created_at: undefined,
    created_by: undefined,
    updated_at: undefined,
    updated_by: undefined,
  },
];

const meta = preview.type<{ parameters: { form: UseFormProps } }>().meta({
  component: OptionSelect,
  parameters: {
    layout: "centered",
    form: {},
  },
  args: {
    property: {
      id: "color",
      name: "color",
      display_name: "Color",
      description: undefined,
      is_required: false,
      is_multi: false,
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
      property_type: EIssuePropertyType.OPTION,
    } satisfies TIssueProperty<EIssuePropertyType.OPTION>,
    options: threeOptions,
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

export const SingleSelected = meta.story({
  parameters: {
    form: { defaultValues: { property_color: ["red"] } },
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

export const Preview = meta.story({
  args: {
    isPreview: true,
  },
  parameters: {
    form: { defaultValues: { property_color: ["blue"] } },
  },
});

export const MultiSelectNone = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      is_multi: true,
    },
  },
});

export const MultiSelectOne = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      is_multi: true,
    },
  },
  parameters: {
    form: { defaultValues: { property_color: ["red"] } },
  },
});

export const MultiSelectTwo = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      is_multi: true,
    },
  },
  parameters: {
    form: { defaultValues: { property_color: ["red", "blue"] } },
  },
});

export const MultiSelectMany = meta.story({
  args: {
    property: {
      ...Default.composed.args.property,
      is_multi: true,
    },
  },
  parameters: {
    form: { defaultValues: { property_color: ["red", "blue", "green"] } },
  },
});

export const ManyOptions = meta.story({
  args: {
    options: [
      ...Default.composed.args.options,
      {
        id: "yellow",
        name: "Yellow",
        is_active: true,
        sort_order: 4,
        property: "color",
        description: undefined,
        logo_props: undefined,
        parent: undefined,
        is_default: undefined,
        created_at: undefined,
        created_by: undefined,
        updated_at: undefined,
        updated_by: undefined,
      },
      {
        id: "purple",
        name: "Purple",
        is_active: true,
        sort_order: 5,
        property: "color",
        description: undefined,
        logo_props: undefined,
        parent: undefined,
        is_default: undefined,
        created_at: undefined,
        created_by: undefined,
        updated_at: undefined,
        updated_by: undefined,
      },
      {
        id: "orange",
        name: "Orange",
        is_active: true,
        sort_order: 6,
        property: "color",
        description: undefined,
        logo_props: undefined,
        parent: undefined,
        is_default: undefined,
        created_at: undefined,
        created_by: undefined,
        updated_at: undefined,
        updated_by: undefined,
      },
      {
        id: "pink",
        name: "Pink",
        is_active: true,
        sort_order: 7,
        property: "color",
        description: undefined,
        logo_props: undefined,
        parent: undefined,
        is_default: undefined,
        created_at: undefined,
        created_by: undefined,
        updated_at: undefined,
        updated_by: undefined,
      },
      {
        id: "cyan",
        name: "Cyan",
        is_active: true,
        sort_order: 8,
        property: "color",
        description: undefined,
        logo_props: undefined,
        parent: undefined,
        is_default: undefined,
        created_at: undefined,
        created_by: undefined,
        updated_at: undefined,
        updated_by: undefined,
      },
    ],
  },
});

export const NoOptions = meta.story({
  args: {
    options: [],
  },
});
