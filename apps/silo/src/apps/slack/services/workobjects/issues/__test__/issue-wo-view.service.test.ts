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

// oxlint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it, vi } from "vitest";
import { IssueWorkObjectViewService } from "../issue-wo-view.service";
import { EWorkObjectEntityType, EWorkObjectFieldType } from "@/apps/slack/types/workobjects";
import type {
  TWorkObjectIssueDetails,
  TWorkObjectViewConfig,
  TWorkObjectCustomFieldValue,
} from "@/apps/slack/types/workobjects";
import { ACTIONS } from "@/apps/slack/helpers/constants";
import type { ExIssueProperty, ExIssuePropertyOption, PlaneUser } from "@plane/sdk";

const MOCK_APP_BASE_URL = "https://app.plane.so";

vi.mock("@/helpers/urls", () => ({
  getUserProfileUrl: (workspaceSlug: string, userId: string) =>
    `${MOCK_APP_BASE_URL}/${workspaceSlug}/profile/${userId}`,
  getIssueUrlFromSequenceId: (workspaceSlug: string, projectIdentifier: string, sequenceId: string) =>
    `${MOCK_APP_BASE_URL}/${workspaceSlug}/browse/${projectIdentifier}-${sequenceId}`,
}));

vi.mock("@plane/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const WORKSPACE_SLUG = "test-workspace";

const createMockIssueDetails = (overrides: Partial<TWorkObjectIssueDetails> = {}): TWorkObjectIssueDetails =>
  ({
    archived_at: null,
    assignees: [
      {
        avatar: "",
        avatar_url: null,
        display_name: "Task Gen Agent Bot",
        email: "integrations03_task-gen-agent_bot@plane.so",
        first_name: "Task Gen Agent",
        id: "f37c2075-e0f4-4291-b619-62be5a79ef9a",
        last_name: "Bot",
      },
      {
        avatar: "",
        avatar_url: null,
        display_name: "surya.prashanth",
        email: "surya.prashanth@plane.so",
        first_name: "Surya",
        id: "63333ab1-c605-42fc-82f7-5cd86799eca1",
        last_name: "Prashanth",
      },
    ],
    completed_at: "2026-02-25T17:09:57.748495Z",
    created_at: "2026-02-18T11:57:58.199037Z",
    created_by: {
      avatar: "",
      avatar_url: null,
      display_name: "surya.prashanth",
      email: "surya.prashanth@plane.so",
      first_name: "Surya",
      id: "63333ab1-c605-42fc-82f7-5cd86799eca1",
      last_name: "Prashanth",
    },
    deleted_at: null,
    description_binary: null,
    description_html:
      '<h1 class="editor-heading-block" data-id="37f63818-168d-4845-a13d-f2af0d0bdc77">Heading 1</h1><h2 class="editor-heading-block" data-id="cffdaa9e-59ad-4b09-94b9-4a156f04396a">Heading 2</h2><ul class="list-disc pl-7 space-y-(--list-spacing-y) tight" data-id="a7402044-1a58-424f-adac-bb6c96cc37eb" data-tight="true"><li class="not-prose space-y-2" data-id="59626ab4-264b-45c2-901c-44999353ce52"><p class="editor-paragraph-block" data-id="a12711ed-3e0b-429a-b56d-0c2840487264">One</p></li><li class="not-prose space-y-2" data-id="602c2ba5-90db-4189-a209-b5582c15061e"><p class="editor-paragraph-block" data-id="782d336e-3c08-42df-892e-664af6e9398c">Two</p></li><li class="not-prose space-y-2" data-id="92bca6cb-0eb5-47b2-8fb1-84b3afeb94d0"><p class="editor-paragraph-block" data-id="901b8c84-11a7-45f6-971f-33d69a79cc96">Three</p></li></ul><p class="editor-paragraph-block" data-id="8da11b3f-686f-47be-8afc-6bebdcfda88a"></p><image-component data-id="a48ab2f5-af89-47cb-aff5-29367838edfc" src="32d47d93-1698-4c0c-bda1-ca2cfed30438" id="a48ab2f5-af89-47cb-aff5-29367838edfc" width="244px" height="102px" aspectratio="2.393238434163701" alignment="left" status="uploaded"></image-component><p class="editor-paragraph-block" data-id="f9bd33d5-19fb-43a0-8ec8-fdb17d41a485">Another text</p><pre class="" data-id="78ccd06f-073f-4aa1-b10a-c053996f5aaa"><code class="language-python">def print_text(arg):\n\tprint(arg)</code></pre>',
    description_stripped: "Heading 1Heading 2OneTwoThreeAnother textdef print_text(arg):\n\tprint(arg)",
    estimate_point: null,
    external_id: null,
    external_source: null,
    id: "bc1488f7-da7a-4b84-8f88-c2824cc8b07c",
    is_draft: false,
    labels: [],
    name: "fasfasfdsa bdfbb",
    parent: null,
    point: null,
    priority: "medium",
    project: {
      cover_image: null,
      cover_image_url: null,
      description: "",
      emoji: null,
      icon_prop: null,
      id: "b5fd5481-0674-4ebf-8b5b-1d2c9f4a2d27",
      identifier: "PALL",
      name: "PALL",
    },
    sequence_id: 23,
    sort_order: 145535,
    start_date: null,
    state: {
      color: "#46A758",
      group: "completed",
      id: "20c09e06-625e-4ef5-bd35-02a961a38b9e",
      name: "Done",
    },
    target_date: null,
    type: {
      created_at: "2026-01-07T10:30:55.616150Z",
      created_by: "63333ab1-c605-42fc-82f7-5cd86799eca1",
      deleted_at: null,
      description: "Default work item type with the option to add new properties",
      external_id: null,
      external_source: null,
      id: "a9bac332-fa3f-4f7f-8ba1-6441c62add58",
      is_active: true,
      is_default: true,
      is_epic: false,
      level: 0,
      logo_props: { icon: { background_color: "#6695FF", color: "#ffffff" }, in_use: "icon" },
      name: "Task",
      updated_at: "2026-01-07T10:30:55.616160Z",
      updated_by: null,
      workspace: "7a2e5944-c117-4a7d-b5f4-058fe705d7d1",
    },
    type_id: "a9bac332-fa3f-4f7f-8ba1-6441c62add58",
    updated_at: "2026-02-25T17:09:57.752278Z",
    updated_by: {
      avatar: "",
      avatar_url: null,
      display_name: "surya.prashanth",
      email: "surya.prashanth@plane.so",
      first_name: "Surya",
      id: "63333ab1-c605-42fc-82f7-5cd86799eca1",
      last_name: "Prashanth",
    },
    workspace: "7a2e5944-c117-4a7d-b5f4-058fe705d7d1",
    ...overrides,
  }) as TWorkObjectIssueDetails;

const createEpicIssueDetails = (overrides: Partial<TWorkObjectIssueDetails> = {}): TWorkObjectIssueDetails =>
  createMockIssueDetails({
    type: {
      created_at: "2026-01-07T10:30:55.616150Z",
      created_by: "63333ab1-c605-42fc-82f7-5cd86799eca1",
      deleted_at: null,
      description: "Epic type",
      external_id: null,
      external_source: null,
      id: "epic-type-id",
      is_active: true,
      is_default: false,
      is_epic: true,
      level: 1,
      logo_props: { icon: { background_color: "#6695FF", color: "#ffffff" }, in_use: "icon" },
      name: "Epic",
      updated_at: "2026-01-07T10:30:55.616160Z",
      updated_by: null,
      workspace: "7a2e5944-c117-4a7d-b5f4-058fe705d7d1",
    },
    ...overrides,
  });

describe("IssueWorkObjectViewService", () => {
  const config: TWorkObjectViewConfig = {};

  describe("MINIMAL view", () => {
    const service = new IssueWorkObjectViewService("MINIMAL");

    it("should return correct top-level work object structure", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_type).toBe(EWorkObjectEntityType.TASK);
      expect(result.url).toBe(`${MOCK_APP_BASE_URL}/${WORKSPACE_SLUG}/browse/PALL-23`);
      expect(result.external_ref).toEqual({
        id: "b5fd5481-0674-4ebf-8b5b-1d2c9f4a2d27:bc1488f7-da7a-4b84-8f88-c2824cc8b07c",
        type: "task",
      });
    });

    it("should use appUnfurlUrl when provided in config", () => {
      const issueDetails = createMockIssueDetails();
      const unfurlConfig: TWorkObjectViewConfig = { appUnfurlUrl: "https://example.com/unfurl" };
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, unfurlConfig);

      expect(result.app_unfurl_url).toBe("https://example.com/unfurl");
      expect(result.url).toBe("https://example.com/unfurl");
    });

    it("should set title and display_id in attributes", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const { attributes } = result.entity_payload;

      expect(attributes.title.text).toBe("fasfasfdsa bdfbb");
      expect(attributes.title.edit).toEqual({ enabled: true });
      expect(attributes.display_id).toBe("PALL-23");
    });

    it("should convert description_html to markdown", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const description = result.entity_payload.fields.description;

      expect(description.type).toBe(EWorkObjectFieldType.STRING);
      expect(description.format).toBe("markdown");
      // Verify HTML was converted to markdown (headings should use atx style)
      expect(description.value).toContain("# Heading 1");
      expect(description.value).toContain("## Heading 2");
      // Verify list items are present
      expect(description.value).toContain("One");
      expect(description.value).toContain("Two");
      expect(description.value).toContain("Three");
    });

    it("should fall back to description_stripped when description_html is empty", () => {
      const issueDetails = createMockIssueDetails({
        description_html: null,
        description_stripped: "Plain text fallback",
      } as Partial<TWorkObjectIssueDetails>);
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_payload.fields.description.value).toBe("Plain text fallback");
    });

    it("should return empty string when both description fields are empty", () => {
      const issueDetails = createMockIssueDetails({
        description_html: null,
        description_stripped: null,
      } as Partial<TWorkObjectIssueDetails>);
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_payload.fields.description.value).toBe("");
    });

    it("should set status field with correct tag color for completed group", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const status = result.entity_payload.fields.status;

      expect(status.value).toBe("Done");
      expect(status.tag_color).toBe("green");
      expect(status.edit).toEqual({
        enabled: true,
        optional: true,
        select: {
          current_value: "20c09e06-625e-4ef5-bd35-02a961a38b9e",
          fetch_options_dynamically: true,
        },
      });
    });

    it("should set priority field with correct tag color for medium", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const priority = result.entity_payload.fields.priority;

      expect(priority.value).toBe("medium");
      expect(priority.tag_color).toBe("yellow");
      expect(priority.edit?.select?.static_options).toHaveLength(5);
    });

    it("should map assignees as custom field array with user details", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const assigneesField = result.entity_payload.custom_fields.find((f) => f.key === "assignees");

      expect(assigneesField).toBeDefined();
      expect(assigneesField!.type).toBe(EWorkObjectFieldType.ARRAY);
      expect(assigneesField!.item_type).toBe(EWorkObjectFieldType.USER);

      const values = assigneesField!.value as Array<{ user: { text: string; url: string } }>;
      expect(values).toHaveLength(2);
      expect(values[0].user.text).toBe("Task Gen Agent Bot");
      expect(values[0].user.url).toBe(
        `${MOCK_APP_BASE_URL}/${WORKSPACE_SLUG}/profile/f37c2075-e0f4-4291-b619-62be5a79ef9a`
      );
      expect(values[1].user.text).toBe("surya.prashanth");

      // Assignees with empty avatar should have icon as undefined
      expect(values[0].user.icon).toBeUndefined();
    });

    it("should include assign-to-me and view-in-plane actions for non-epic issues", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const actions = result.entity_payload.actions!.primary_actions;

      expect(actions).toHaveLength(2);
      expect(actions[0].action_id).toBe(ACTIONS.ASSIGN_TO_ME_WO);
      expect(actions[0].text).toBe("Add me to Assignees");
      expect(actions[0].value).toBe("b5fd5481-0674-4ebf-8b5b-1d2c9f4a2d27.bc1488f7-da7a-4b84-8f88-c2824cc8b07c");
      expect(actions[1].action_id).toBe(ACTIONS.VIEW_IN_PLANE);
      expect(actions[1].url).toBe(`${MOCK_APP_BASE_URL}/${WORKSPACE_SLUG}/browse/PALL-23`);
    });

    it("should not include detailed fields (date_created, due_date, etc.)", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const { fields } = result.entity_payload;

      expect(fields.date_created).toBeUndefined();
      expect(fields.due_date).toBeUndefined();
      expect(fields.date_updated).toBeUndefined();
    });

    it("should include display_order", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_payload.display_order).toEqual([
        "type",
        "description",
        "status",
        "priority",
        "assignees",
        "labels",
        "start_date",
        "due_date",
        "date_created",
        "date_updated",
      ]);
    });
  });

  describe("DETAILED view", () => {
    const service = new IssueWorkObjectViewService("DETAILED");

    it("should include date_created as timestamp", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const dateCreated = result.entity_payload.fields.date_created;

      expect(dateCreated.type).toBe(EWorkObjectFieldType.TIMESTAMP);
      expect(dateCreated.value).toBe(Math.floor(new Date("2026-02-18T11:57:58.199037Z").valueOf() / 1000));
    });

    it("should include date_updated when updated_at is present", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const dateUpdated = result.entity_payload.fields.date_updated;

      expect(dateUpdated).toBeDefined();
      expect(dateUpdated.type).toBe(EWorkObjectFieldType.TIMESTAMP);
      expect(dateUpdated.value).toBe(Math.floor(new Date("2026-02-25T17:09:57.752278Z").valueOf() / 1000));
    });

    it("should include due_date field with edit enabled", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const dueDate = result.entity_payload.fields.due_date;

      expect(dueDate.type).toBe(EWorkObjectFieldType.DATE);
      // target_date is null in mock, so value should be falsy
      expect(dueDate.value).toBeFalsy();
      expect(dueDate.edit).toEqual({ enabled: true, optional: true });
    });

    it("should format target_date as YYYY-MM-DD when present", () => {
      const issueDetails = createMockIssueDetails({
        target_date: "2026-03-15T00:00:00.000Z",
      } as Partial<TWorkObjectIssueDetails>);
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_payload.fields.due_date.value).toBe("2026-03-15");
    });

    it("should include start_date custom field", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const startDate = result.entity_payload.custom_fields.find((f) => f.key === "start_date");

      expect(startDate).toBeDefined();
      expect(startDate!.type).toBe(EWorkObjectFieldType.DATE);
      expect(startDate!.edit).toEqual({ enabled: true, optional: true });
    });

    it("should include type custom field with value 'Task'", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const typeField = result.entity_payload.custom_fields.find((f) => f.key === "type");

      expect(typeField).toBeDefined();
      expect(typeField!.value).toBe("Task");
      expect(typeField!.tag_color).toBe("blue");
    });

    it("should include labels custom field with edit config", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const labels = result.entity_payload.custom_fields.find((f) => f.key === "labels");

      expect(labels).toBeDefined();
      expect(labels!.type).toBe(EWorkObjectFieldType.ARRAY);
      expect(labels!.item_type).toBe(EWorkObjectFieldType.STRING);
      expect(labels!.value).toEqual([]); // no labels in mock
      expect(labels!.edit?.select?.fetch_options_dynamically).toBe(true);
    });

    it("should include labels with tag colors when labels are present", () => {
      const issueDetails = createMockIssueDetails({
        labels: [
          { id: "label-1", name: "Bug", color: "#ff0000" },
          { id: "label-2", name: "Feature", color: "#00ff00" },
        ],
      } as Partial<TWorkObjectIssueDetails>);
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const labels = result.entity_payload.custom_fields.find((f) => f.key === "labels");

      const values = labels!.value as Array<{ value: string; tag_color: string }>;
      expect(values).toHaveLength(2);
      expect(values[0].value).toBe("Bug");
      expect(values[1].value).toBe("Feature");
      // tag_color should be one of the valid colors
      expect(["red", "yellow", "green", "gray", "blue"]).toContain(values[0].tag_color);
      expect(labels!.edit?.select?.current_values).toEqual(["label-1", "label-2"]);
    });

    it("should not include parent field when parent is null", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const parent = result.entity_payload.custom_fields.find((f) => f.key === "parent");

      expect(parent).toBeUndefined();
    });

    it("should include parent field when parent exists in additionalDetails", () => {
      const issueDetails = createMockIssueDetails({
        parent: "parent-issue-id",
        additionalDetails: {
          parent: { sequence_id: 10 },
        },
      } as unknown as Partial<TWorkObjectIssueDetails>);
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const parent = result.entity_payload.custom_fields.find((f) => f.key === "parent");

      expect(parent).toBeDefined();
      expect(parent!.value).toBe("PALL-10");
      expect(parent!.tag_color).toBe("red");
      expect(parent!.link).toBe(`${MOCK_APP_BASE_URL}/${WORKSPACE_SLUG}/browse/PALL-10`);
    });

    it("should merge description from detailed over minimal", () => {
      const issueDetails = createMockIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const description = result.entity_payload.fields.description;

      // Detailed description should contain markdown with headings
      expect(description.format).toBe("markdown");
      expect(description.value).toContain("# Heading 1");
    });
  });

  describe("Epic issues", () => {
    it("should remove edit from title for epics", () => {
      const service = new IssueWorkObjectViewService("MINIMAL");
      const issueDetails = createEpicIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      expect(result.entity_payload.attributes.title.edit).toBeUndefined();
    });

    it("should remove edit from all fields for epics", () => {
      const service = new IssueWorkObjectViewService("MINIMAL");
      const issueDetails = createEpicIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      Object.values(result.entity_payload.fields).forEach((field) => {
        expect(field).not.toHaveProperty("edit");
      });
    });

    it("should remove edit from all custom fields for epics", () => {
      const service = new IssueWorkObjectViewService("MINIMAL");
      const issueDetails = createEpicIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      result.entity_payload.custom_fields.forEach((customField) => {
        expect(customField).not.toHaveProperty("edit");
      });
    });

    it("should not include assign-to-me action for epics", () => {
      const service = new IssueWorkObjectViewService("MINIMAL");
      const issueDetails = createEpicIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const actions = result.entity_payload.actions!.primary_actions;

      expect(actions).toHaveLength(1);
      expect(actions[0].action_id).toBe(ACTIONS.VIEW_IN_PLANE);
    });

    it("should show 'Epic' as type value in detailed view", () => {
      const service = new IssueWorkObjectViewService("DETAILED");
      const issueDetails = createEpicIssueDetails();
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const typeField = result.entity_payload.custom_fields.find((f) => f.key === "type");

      expect(typeField).toBeDefined();
      expect(typeField!.value).toBe("Epic");
    });
  });

  describe("custom properties (DETAILED view)", () => {
    const service = new IssueWorkObjectViewService("DETAILED");

    it("should return empty custom fields when additionalDetails is missing", () => {
      const issueDetails = createMockIssueDetails({ additionalDetails: undefined });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);

      // Should still have built-in custom fields (assignees, start_date, type, labels) but no extra property-based ones
      const builtInKeys = ["assignees", "start_date", "type", "labels"];
      const extraFields = result.entity_payload.custom_fields.filter((f) => !builtInKeys.includes(f.key));
      expect(extraFields).toHaveLength(0);
    });

    it("should handle DATETIME property type", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-date",
                display_name: "Due By",
                property_type: "DATETIME",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-date", [{ property_id: "prop-date", values: ["2026-06-15T00:00:00Z"] }]]]),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const dateField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-date"
      );

      expect(dateField).toBeDefined();
      expect(dateField!.type).toBe(EWorkObjectFieldType.DATE);
      expect(dateField!.value).toBe("2026-06-15");
      expect(dateField!.edit).toEqual({ enabled: true, optional: true });
    });

    it("should handle BOOLEAN property type", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-bool",
                display_name: "Is Blocked",
                property_type: "BOOLEAN",
                is_required: true,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-bool", [{ property_id: "prop-bool", values: ["true"] }]]]),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const boolField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-bool"
      );

      expect(boolField).toBeDefined();
      expect(boolField!.type).toBe(EWorkObjectFieldType.BOOLEAN);
      expect(boolField!.value).toBe(true);
      expect(boolField!.edit).toEqual({ enabled: true, optional: false });
    });

    it("should handle BOOLEAN property defaulting to false when no value", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-bool",
                display_name: "Is Blocked",
                property_type: "BOOLEAN",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map(),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const boolField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-bool"
      );

      expect(boolField!.value).toBe(false);
    });

    it("should handle DECIMAL property type", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-num",
                display_name: "Story Points",
                property_type: "DECIMAL",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-num", [{ property_id: "prop-num", values: ["8.5"] }]]]),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const numField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-num"
      );

      expect(numField).toBeDefined();
      expect(numField!.type).toBe(EWorkObjectFieldType.INTEGER);
      expect(numField!.value).toBe(8); // Math.floor
    });

    it("should handle DECIMAL with NaN value", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-num",
                display_name: "Story Points",
                property_type: "DECIMAL",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-num", [{ property_id: "prop-num", values: ["not-a-number"] }]]]),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const numField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-num"
      );

      expect(numField!.value).toBe(0);
    });

    it("should handle single-select OPTION property type", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-opt",
                display_name: "Category",
                property_type: "OPTION",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-opt", [{ property_id: "prop-opt", values: ["opt-1"] }]]]),
            propertyOptions: new Map([
              [
                "prop-opt",
                [
                  { id: "opt-1", name: "Frontend" },
                  { id: "opt-2", name: "Backend" },
                ] as ExIssuePropertyOption[],
              ],
            ]),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const optField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-opt"
      );

      expect(optField).toBeDefined();
      expect(optField!.type).toBe(EWorkObjectFieldType.STRING);
      expect(optField!.value).toBe("Frontend");
      expect(optField!.edit?.select?.current_value).toBe("opt-1");
      expect(optField!.edit?.select?.fetch_options_dynamically).toBe(true);
    });

    it("should show 'No Selection' for single-select OPTION with no value", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-opt",
                display_name: "Category",
                property_type: "OPTION",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map(),
            propertyOptions: new Map([["prop-opt", [{ id: "opt-1", name: "Frontend" }] as ExIssuePropertyOption[]]]),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const optField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-opt"
      );

      expect(optField!.value).toBe("No Selection");
      expect(optField!.edit?.select?.current_value).toBe("");
    });

    it("should handle multi-select OPTION property type", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-multi",
                display_name: "Tags",
                property_type: "OPTION",
                is_required: false,
                is_multi: true,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-multi", [{ property_id: "prop-multi", values: ["opt-1", "opt-2"] }]]]),
            propertyOptions: new Map([
              [
                "prop-multi",
                [
                  { id: "opt-1", name: "UI" },
                  { id: "opt-2", name: "API" },
                ] as ExIssuePropertyOption[],
              ],
            ]),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const multiField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-multi"
      );

      expect(multiField).toBeDefined();
      expect(multiField!.type).toBe(EWorkObjectFieldType.ARRAY);
      expect(multiField!.item_type).toBe(EWorkObjectFieldType.STRING);
      const values = multiField!.value as Array<{ value: string }>;
      expect(values).toHaveLength(2);
      expect(values[0].value).toBe("UI");
      expect(values[1].value).toBe("API");
      expect(multiField!.edit?.select?.current_values).toEqual(["opt-1", "opt-2"]);
    });

    it("should handle USER RELATION property with single select", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-user",
                display_name: "Reviewer",
                property_type: "RELATION",
                relation_type: "USER",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-user", [{ property_id: "prop-user", values: ["user-1"] }]]]),
            propertyOptions: new Map(),
          },
          projectMembers: [
            { id: "user-1", display_name: "Alice", avatar: "https://avatar.example.com/alice.png" },
            { id: "user-2", display_name: "Bob", avatar: "" },
          ] as PlaneUser[],
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const userField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-user"
      );

      expect(userField).toBeDefined();
      expect(userField!.type).toBe(EWorkObjectFieldType.USER);
      const userValue = userField as TWorkObjectCustomFieldValue & { user: { text: string; icon?: { url: string } } };
      expect(userValue.user.text).toBe("Alice");
      expect(userValue.user.icon?.url).toBe("https://avatar.example.com/alice.png");
    });

    it("should handle USER RELATION with no members returning 'No Selection'", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-user",
                display_name: "Reviewer",
                property_type: "RELATION",
                relation_type: "USER",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map(),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const userField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-user"
      );

      expect(userField!.value).toBe("No Selection");
    });

    it("should handle multi-select USER RELATION property", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-users",
                display_name: "Reviewers",
                property_type: "RELATION",
                relation_type: "USER",
                is_required: false,
                is_multi: true,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-users", [{ property_id: "prop-users", values: ["user-1", "user-2"] }]]]),
            propertyOptions: new Map(),
          },
          projectMembers: [
            { id: "user-1", display_name: "Alice", avatar: "" },
            { id: "user-2", display_name: "Bob", avatar: "" },
          ] as PlaneUser[],
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const usersField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-users"
      );

      expect(usersField!.type).toBe(EWorkObjectFieldType.ARRAY);
      expect(usersField!.item_type).toBe(EWorkObjectFieldType.USER);
      const values = usersField!.value as Array<{ user: { text: string } }>;
      expect(values).toHaveLength(2);
      expect(values[0].user.text).toBe("Alice");
      expect(values[1].user.text).toBe("Bob");
    });

    it("should handle TEXT property type as STRING", () => {
      const issueDetails = createMockIssueDetails({
        additionalDetails: {
          propertyDetails: {
            properties: [
              {
                id: "prop-text",
                display_name: "Notes",
                property_type: "TEXT",
                is_required: false,
                is_multi: false,
              } as ExIssueProperty,
            ],
            propertyValues: new Map([["prop-text", [{ property_id: "prop-text", values: ["Some notes"] }]]]),
            propertyOptions: new Map(),
          },
        },
      });
      const result = service.getWorkItemView(WORKSPACE_SLUG, issueDetails, config);
      const textField = result.entity_payload.custom_fields.find(
        (f) => f.key === "a9bac332-fa3f-4f7f-8ba1-6441c62add58:prop-text"
      );

      expect(textField).toBeDefined();
      expect(textField!.type).toBe(EWorkObjectFieldType.STRING);
      expect(textField!.value).toBe("Some notes");
    });
  });
});
