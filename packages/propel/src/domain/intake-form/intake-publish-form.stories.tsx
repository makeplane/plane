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
import { fn } from "storybook/test";
import type { TIntakeFormProperty, TLogoProps } from "@plane/types";
import { EIssuePropertyType } from "@plane/types";
import { IntakePublishForm } from "./intake-publish-form";

const sampleProperties: TIntakeFormProperty[] = [
  {
    property: {
      id: "prop-1",
      name: "priority",
      display_name: "Priority",
      description: "Select priority level",
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
    },
    options: [
      {
        id: "opt-1",
        name: "High",
        is_active: true,
        sort_order: 1,
        property: "prop-1",
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
        id: "opt-2",
        name: "Medium",
        is_active: true,
        sort_order: 2,
        property: "prop-1",
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
        id: "opt-3",
        name: "Low",
        is_active: true,
        sort_order: 3,
        property: "prop-1",
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
  {
    property: {
      id: "prop-2",
      name: "due_date",
      display_name: "Due Date",
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
      property_type: EIssuePropertyType.DATETIME,
    },
    options: [],
  },
];

const allPropertyTypes: TIntakeFormProperty[] = [
  {
    property: {
      id: "prop-text",
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
    },
    options: [],
  },
  {
    property: {
      id: "prop-text-multi",
      name: "details",
      display_name: "Details",
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
      settings: { display_format: "multi-line" },
      property_type: EIssuePropertyType.TEXT,
    },
    options: [],
  },
  {
    property: {
      id: "prop-num",
      name: "estimate",
      display_name: "Estimate (hours)",
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
      property_type: EIssuePropertyType.DECIMAL,
    },
    options: [],
  },
  {
    property: {
      id: "prop-bool",
      name: "urgent",
      display_name: "Is Urgent?",
      description: "Mark if this is urgent",
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
      property_type: EIssuePropertyType.BOOLEAN,
    },
    options: [],
  },
  {
    property: {
      id: "prop-url",
      name: "link",
      display_name: "Reference URL",
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
      property_type: EIssuePropertyType.URL,
    },
    options: [],
  },
  {
    property: {
      id: "prop-opt",
      name: "category",
      display_name: "Category",
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
    },
    options: [
      {
        id: "cat-1",
        name: "Bug",
        is_active: true,
        sort_order: 1,
        property: "prop-opt",
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
        id: "cat-2",
        name: "Feature",
        is_active: true,
        sort_order: 2,
        property: "prop-opt",
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
  {
    property: {
      id: "prop-date",
      name: "deadline",
      display_name: "Deadline",
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
      property_type: EIssuePropertyType.DATETIME,
    },
    options: [],
  },
];

const projectLogo: TLogoProps = { in_use: "emoji", emoji: { value: "128640" } };

const emptyProperties: TIntakeFormProperty[] = [];

const meta = preview.meta({
  component: IntakePublishForm,
  parameters: {
    layout: "centered",
  },
  args: {
    projectName: "Plane Frontend",
    projectLogo,
    projectCoverImageFallback: "https://placehold.co/600x133/3b82f6/white?text=Plane",
    formTitle: "Submit a work item",
    properties: sampleProperties,
    isPreview: false,
    isSubmitting: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({});

const iconLogo: TLogoProps = { in_use: "icon", icon: { name: "rocket_launch", color: "#3b82f6" } };

export const Preview = meta.story({
  args: {
    projectLogo: iconLogo,
    formTitle: "Preview Mode",
    properties: emptyProperties,
    isPreview: true,
  },
});

export const AllPropertyTypes = meta.story({
  args: {
    projectName: "Test Project",
    projectCoverImageFallback: "https://placehold.co/600x133/6366f1/white?text=Test",
    formTitle: "All Field Types",
    properties: allPropertyTypes,
    onSubmit: fn(),
  },
});

export const Submitting = meta.story({
  args: {
    formTitle: "Submitting Form",
    properties: emptyProperties,
    isSubmitting: true,
    onSubmit: fn(),
  },
});

export const WithEditorComponent = meta.story({
  args: {
    formTitle: "With Custom Editor",
    properties: emptyProperties,
    onSubmit: fn(),
    editorComponent: (props: { onChange: (json: object, html: string) => void }) => (
      <div className="border border-subtle-1 rounded-md p-2 min-h-[120px]" data-testid="custom-editor">
        <textarea
          placeholder="Custom editor"
          onChange={(e) => props.onChange({}, e.target.value)}
          className="w-full min-h-[100px] outline-none text-13"
        />
      </div>
    ),
  },
});

export const NoFormTitle = meta.story({
  args: {
    projectName: "Default Title Project",
    projectLogo: undefined,
    formTitle: "",
    properties: emptyProperties,
    onSubmit: fn(),
  },
});

export const PreviewWithAllProperties = meta.story({
  args: {
    projectName: "Preview Project",
    projectCoverImageFallback: "https://placehold.co/600x133/6366f1/white?text=Preview",
    formTitle: "Preview All Fields",
    properties: allPropertyTypes,
    isPreview: true,
  },
});
