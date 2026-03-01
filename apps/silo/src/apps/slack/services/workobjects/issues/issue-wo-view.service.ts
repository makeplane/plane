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

import {
  ACTIONS,
  PLANE_PRIORITIES,
  WORKOBJECT_PRIORITY_TAG_COLOR_MAP,
  WORKOBJECT_STATE_TAG_COLOR_MAP,
} from "@/apps/slack/helpers/constants";
import { formatDateToYYYYMMDD } from "@/apps/slack/helpers/format-date";
import { getSlackIssueIdentityKey } from "@/apps/slack/helpers/keys";
import { EWorkObjectEntityType, EWorkObjectFieldType } from "@/apps/slack/types/workobjects";
import type {
  IIssueWorkObjectViewService,
  TWorkObjectIssueDetails,
  TWorkObjectViewConfig,
  TWorkObjectView,
  TWorkObjectEntityPayload,
  TWorkObjectType,
  TWorkObjectCustomFieldValue,
  TWorkObjectAdditionalIssueDetails,
  TWorkObjectTagColor,
  TWorkObjectAction,
} from "@/apps/slack/types/workobjects";
import { getIssueUrlFromSequenceId, getUserProfileUrl } from "@/helpers/urls";
import { logger } from "@plane/logger";
import type { ExIssueProperty, ExIssuePropertyOption } from "@plane/sdk";
import TurndownService from "turndown";

/**
 * Available tag colors for visual categorization in Slack Work Objects
 */
const TAG_COLORS: TWorkObjectTagColor[] = ["red", "yellow", "green", "gray", "blue"];

/**
 * Converts issue description HTML to markdown, falling back to stripped plain text.
 *
 * @param descriptionHtml - HTML description content (may be null/undefined)
 * @param descriptionStripped - Plain text fallback (may be null/undefined)
 * @returns Markdown string or empty string
 */
const getDescriptionMarkdown = (
  descriptionHtml: string | null | undefined,
  descriptionStripped: string | null | undefined
): string =>
  descriptionHtml
    ? new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
      }).turndown(descriptionHtml)
    : (descriptionStripped ?? "");

/**
 * Service responsible for transforming Plane issue data into Slack Work Object view format.
 *
 * Handles both minimal and detailed view modes:
 * - MINIMAL: Shows essential fields (title, status, priority, assignees)
 * - DETAILED: Includes all minimal fields plus dates, labels, parent, type, and custom properties
 *
 * Converts Plane property types to Slack Work Object field types and handles:
 * - Core fields (title, status, priority, description, dates)
 * - Custom properties (text, number, date, boolean, options, relations)
 * - Multi-select vs single-select handling
 * - Dynamic option fetching configuration
 */
export class IssueWorkObjectViewService implements IIssueWorkObjectViewService {
  /**
   * Creates an instance of IssueWorkObjectViewService
   * @param type - View mode: "MINIMAL" for basic view or "DETAILED" for complete view
   */
  constructor(private readonly type: TWorkObjectType) {}

  /**
   * Returns a random tag color from available options.
   * Used for visual variety in labels and other tagged elements.
   *
   * @returns Random color from TAG_COLORS array
   */
  private getRandomTagColor(): TWorkObjectTagColor {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  }

  /**
   * Generates complete Slack Work Object view from Plane issue details.
   *
   * Creates the Work Object structure including:
   * - URL for deep linking to Plane
   * - External reference for tracking
   * - Entity payload with fields and actions
   * - Conditional detailed view expansion based on service type
   *
   * @param workspaceSlug - Workspace identifier for URL construction
   * @param issueDetails - Complete issue data from Plane API
   * @param config - View configuration including optional unfurl URL
   * @returns Formatted Work Object ready for Slack API
   */
  getWorkItemView(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails,
    config: TWorkObjectViewConfig
  ): TWorkObjectView {
    const entityPayload = this.createEntityPayload(workspaceSlug, issueDetails, config);

    const isEpic = issueDetails.type?.is_epic;

    if (this.type === "DETAILED") {
      const additionalDetailedPayload = this.createDetailedEntityPayload(workspaceSlug, issueDetails);
      // Merge the fields retrieved from both the detailed and minimal view
      entityPayload.fields = {
        ...entityPayload.fields,
        ...additionalDetailedPayload.fields,
      };
      // Merge the custom_fields received from both the details and minimal view
      entityPayload.custom_fields = [...entityPayload.custom_fields, ...additionalDetailedPayload.custom_fields];
    }

    // Remove edit capabilities for Epics (read-only)
    if (isEpic) {
      this.removeEditsForEpics(entityPayload);
    }

    const baseRefId = getSlackIssueIdentityKey(issueDetails.project.id ?? "", issueDetails.id);

    return {
      app_unfurl_url: config.appUnfurlUrl,
      // URL Field is required for the flexpane component
      url:
        config.appUnfurlUrl ??
        getIssueUrlFromSequenceId(
          workspaceSlug,
          issueDetails.project.identifier ?? "",
          issueDetails.sequence_id.toString() ?? ""
        ), // URL representing the resource in the third party system
      external_ref: {
        // NOTE: We for most of the part separating the ids with `.` but here, we have to use `:` as, `.` is not allowed for id, and if we use `-` we end up corrupting the id, as these are uuids.
        id: baseRefId,
        type: "task",
      },
      entity_type: EWorkObjectEntityType.TASK,
      entity_payload: entityPayload,
    };
  }

  /**
   * Removes edit capabilities from all fields for Epic work items.
   * Epics are read-only in Slack Work Objects and should not allow inline editing.
   *
   * Modifies the entity payload in-place by removing:
   * - Title edit configuration from attributes
   * - Edit configuration from all standard fields
   * - Edit configuration from all custom fields
   *
   * @param entityPayload - Entity payload to modify
   */
  private removeEditsForEpics(entityPayload: TWorkObjectEntityPayload): void {
    // Remove edit from title attribute
    if (entityPayload.attributes.title.edit) {
      delete entityPayload.attributes.title.edit;
    }

    // Remove edit from all fields
    Object.values(entityPayload.fields).forEach((field) => {
      if (field && typeof field === "object" && "edit" in field) {
        delete field.edit;
      }
    });

    // Remove edit from all custom fields
    entityPayload.custom_fields.forEach((customField) => {
      if (customField.edit) {
        delete customField.edit;
      }
    });
  }

  /**
   * Creates the base entity payload for minimal Work Object view.
   *
   * Includes essential fields that appear in both minimal and detailed views:
   * - Title (editable)
   * - Display ID (project identifier + sequence number)
   * - Description (truncated to 100 characters)
   * - Status with tag color (editable, dynamic options)
   * - Priority with tag color (editable, static options)
   * - Assignees as custom field array (editable, dynamic options)
   * - Primary actions (assign to me, view in Plane)
   *
   * @param workspaceSlug - Workspace identifier for URL generation
   * @param issueDetails - Complete issue data
   * @param _config - View configuration (currently unused)
   * @returns Base entity payload structure
   */
  private createEntityPayload(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails,
    _config: TWorkObjectViewConfig
  ): TWorkObjectEntityPayload {
    return {
      attributes: {
        title: {
          text: issueDetails.name,
          edit: {
            enabled: true,
          },
        },
        display_id: `${issueDetails.project.identifier}-${issueDetails.sequence_id}`,
      },
      fields: {
        /* ----------- Available Properties --------------- */
        description: {
          type: EWorkObjectFieldType.STRING,
          value: getDescriptionMarkdown(issueDetails.description_html, issueDetails.description_stripped),
          format: "markdown",
        },
        status: {
          type: EWorkObjectFieldType.STRING,
          value: issueDetails.state.name,
          tag_color: WORKOBJECT_STATE_TAG_COLOR_MAP.get(issueDetails.state.group) ?? "gray",
          edit: {
            enabled: true,
            optional: true,
            select: {
              current_value: issueDetails.state.id,
              fetch_options_dynamically: true,
            },
          },
        },
        priority: {
          type: EWorkObjectFieldType.STRING,
          value: issueDetails.priority,
          tag_color: WORKOBJECT_PRIORITY_TAG_COLOR_MAP.get(issueDetails.priority),
          edit: {
            enabled: true,
            optional: true,
            select: {
              current_value: issueDetails.priority,
              static_options: PLANE_PRIORITIES.map((priority) => {
                return {
                  text: {
                    type: "plain_text",
                    text: priority.name,
                  },
                  value: priority.value,
                };
              }),
            },
          },
        },
      },
      custom_fields: [
        /*
         * NOTE: This is an exception as assignees in the fields is an object, and with slack workobject, the schema assumes that
         * there can be only one assignee, while in Plane we have concept of multiple assignees.
         */
        {
          label: "Assignees",
          key: "assignees",
          type: EWorkObjectFieldType.ARRAY,
          item_type: EWorkObjectFieldType.USER,
          value: issueDetails.assignees.map((assignee) => ({
            user: {
              // email: assignee.email,
              text: assignee.display_name,
              url: getUserProfileUrl(workspaceSlug, assignee.id),
              icon: assignee.avatar
                ? {
                    alt_text: assignee.display_name,
                    url: assignee.avatar,
                  }
                : undefined,
            },
          })),
          edit: {
            enabled: true,
            optional: true,
            select: {
              fetch_options_dynamically: true,
              current_values: issueDetails.assignees.map((assignee) => assignee.id),
            },
          },
        },
      ],
      actions: {
        primary_actions: this.createEntityPayloadActions(workspaceSlug, issueDetails),
        overflow_actions: [],
      },
      display_order: [
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
      ],
    };
  }

  /**
   * Creates primary action buttons for the Work Object.
   *
   * Actions provided:
   * - "Add me to Assignees": Quick assign current user to issue (excluded for epics)
   * - "View in Plane": Deep link to issue in Plane web app
   *
   * @param workspaceSlug - Workspace identifier for URL construction
   * @param issueDetails - Issue data for action value construction
   * @returns Array of action button configurations
   */
  private createEntityPayloadActions(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails
  ): TWorkObjectAction[] {
    const isEpic = issueDetails.type?.is_epic;

    const actions: TWorkObjectAction[] = [];

    // Only show "Assign to me" button for non-epic issues
    if (!isEpic) {
      actions.push({
        action_id: ACTIONS.ASSIGN_TO_ME_WO,
        text: "Add me to Assignees",
        style: "primary",
        value: `${issueDetails.project.id}.${issueDetails.id}`,
      });
    }

    // Always show "View in Plane" button
    actions.push({
      action_id: ACTIONS.VIEW_IN_PLANE,
      text: "View in Plane",
      url: getIssueUrlFromSequenceId(
        workspaceSlug,
        issueDetails.project.identifier ?? "",
        issueDetails.sequence_id.toString()
      ),
    });

    return actions;
  }

  /**
   * Creates additional fields and custom fields for detailed Work Object view.
   *
   * Extends minimal view with:
   * - Full description (not truncated)
   * - Created and updated timestamps
   * - Due date (editable)
   * - Start date custom field (editable)
   * - Parent issue link (if exists)
   * - Issue type badge
   * - Labels array (editable, dynamic options)
   * - All custom properties from Plane
   *
   * @param workspaceSlug - Workspace identifier for URL generation
   * @param issueDetails - Complete issue data with additional details
   * @returns Additional fields and custom fields for detailed view
   */
  private createDetailedEntityPayload(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails
  ): Omit<TWorkObjectEntityPayload, "display_order" | "attributes"> {
    return {
      fields: {
        /* ----------- Available Properties --------------- */
        description: {
          type: EWorkObjectFieldType.STRING,
          value: getDescriptionMarkdown(issueDetails.description_html, issueDetails.description_stripped),
          format: "markdown",
        },
        date_created: {
          type: EWorkObjectFieldType.TIMESTAMP,
          value: Math.floor(new Date(issueDetails.created_at).valueOf() / 1000),
        },

        /* ----------- Optional Properties --------------- */
        ...(issueDetails.updated_at && {
          date_updated: {
            type: EWorkObjectFieldType.TIMESTAMP,
            value: Math.floor(new Date(issueDetails.updated_at).valueOf() / 1000),
          },
        }),
        due_date: {
          type: EWorkObjectFieldType.DATE,
          value: issueDetails.target_date && formatDateToYYYYMMDD(issueDetails.target_date),
          edit: {
            enabled: true,
            optional: true,
          },
        },
      },
      custom_fields: [
        {
          key: "start_date",
          label: "Start Date",
          type: EWorkObjectFieldType.DATE as const,
          value: issueDetails.start_date && formatDateToYYYYMMDD(issueDetails.start_date),
          edit: {
            enabled: true,
            optional: true,
          },
        },
        ...(issueDetails.parent && issueDetails.additionalDetails?.parent
          ? [
              {
                key: "parent",
                label: "Parent",
                type: EWorkObjectFieldType.STRING as const,
                value: `${issueDetails.project.identifier}-${issueDetails.additionalDetails.parent.sequence_id}`,
                link: getIssueUrlFromSequenceId(
                  workspaceSlug,
                  issueDetails.project.identifier!,
                  issueDetails.additionalDetails.parent.sequence_id.toString()
                ),
                tag_color: "red" as const,
              },
            ]
          : []),
        ...(issueDetails.type
          ? [
              {
                key: "type",
                label: "Type",
                type: EWorkObjectFieldType.STRING as const,
                value: issueDetails.type.is_epic ? "Epic" : issueDetails.type.name,
                tag_color: "blue" as const,
              },
            ]
          : []),
        {
          key: "labels",
          label: "Labels",
          type: EWorkObjectFieldType.ARRAY as const,
          item_type: EWorkObjectFieldType.STRING as const,
          value: issueDetails.labels.map((label) => ({
            value: label.name,
            tag_color: this.getRandomTagColor(),
          })),
          edit: {
            enabled: true,
            optional: true,
            select: {
              fetch_options_dynamically: true,
              current_values: issueDetails.labels.map((label) => label.id),
            },
          },
        },
        // Don't include custom fields for epics
        ...(issueDetails.type?.is_epic ? [] : this.createCustomFields(workspaceSlug, issueDetails).custom_fields),
      ],
    };
  }

  /**
   * Transforms Plane custom properties into Work Object custom fields.
   *
   * Iterates through all custom properties defined for the issue type and converts
   * each property with its current value into Work Object field format.
   *
   * Returns empty array if:
   * - Additional details are missing
   * - Property details are not loaded
   *
   * @param workspaceSlug - Workspace identifier for URL generation
   * @param issueDetails - Complete issue data including property values
   * @returns Object containing array of custom field definitions
   */
  private createCustomFields(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails
  ): Pick<TWorkObjectEntityPayload, "custom_fields"> {
    const additionalDetails = issueDetails.additionalDetails;
    if (!additionalDetails || !additionalDetails.propertyDetails) {
      logger.warn(
        "[Slack WorkObjects] No additional details or propertyDetails found, skipping custom field creation",
        issueDetails.additionalDetails
      );
      return { custom_fields: [] };
    }

    const {
      propertyDetails: { properties, propertyValues, propertyOptions: propertyOptionsMap },
    } = additionalDetails;

    return {
      custom_fields: properties.map((property): TWorkObjectCustomFieldValue => {
        // We are certain that the property.id is going to be present
        const typeId = issueDetails.type_id ?? "";
        const propertyId = property.id ?? property.display_name;
        const propertyValue = propertyValues.get(propertyId);
        const propertyOptions = propertyOptionsMap.get(propertyId);

        return this.createWOCustomFieldFromIssueProperty(
          workspaceSlug,
          typeId,
          property,
          propertyValue,
          propertyOptions,
          additionalDetails
        );
      }),
    };
  }

  /**
   * Converts a single Plane property to Work Object custom field format.
   *
   * Handles property type mapping:
   * - DATETIME → DATE field (formatted as YYYY-MM-DD)
   * - BOOLEAN → BOOLEAN field (true/false)
   * - DECIMAL → INTEGER field (rounded down)
   * - OPTION → STRING or ARRAY based on is_multi flag
   * - RELATION (USER type) → USER or ARRAY<USER> based on is_multi flag
   * - TEXT/URL/EMAIL/FILE → STRING field
   *
   * Configures edit capabilities:
   * - Sets enabled/optional based on property configuration
   * - Configures dynamic option fetching for selects
   * - Sets current values for multi-select fields
   *
   * @param workspaceSlug - Workspace identifier for user profile URLs
   * @param issueTypeId - Issue type ID for field key namespacing
   * @param property - Property definition from Plane
   * @param propertyValue - Current value(s) set on the issue
   * @param propertyOptions - Available options for OPTION type properties
   * @param additionalDetails - Additional context (project members for USER relations)
   * @returns Work Object custom field definition with value and edit config
   */
  private createWOCustomFieldFromIssueProperty(
    workspaceSlug: string,
    issueTypeId: string,
    property: ExIssueProperty,
    propertyValue:
      | {
          property_id: string;
          values: string[];
        }[]
      | undefined,
    propertyOptions: ExIssuePropertyOption[] | undefined,
    additionalDetails: TWorkObjectAdditionalIssueDetails
  ): TWorkObjectCustomFieldValue {
    const propertyLabel = property.display_name;
    const propertyKey = `${issueTypeId}:${property.id}`;

    if (property.property_type === "DATETIME") {
      const value = propertyValue ? (propertyValue[0]?.values[0] ?? "") : "";

      return {
        key: propertyKey,
        label: propertyLabel,
        type: EWorkObjectFieldType.DATE,
        value: value && formatDateToYYYYMMDD(value),
        edit: {
          enabled: true,
          optional: !property.is_required,
        },
      };
    }

    if (property.property_type === "BOOLEAN") {
      const value = propertyValue ? (propertyValue[0]?.values[0] ?? "false") : "false";

      return {
        key: propertyKey,
        label: propertyLabel,
        type: EWorkObjectFieldType.BOOLEAN,
        value: value.toLowerCase() === "true" ? true : false,
        edit: {
          enabled: true,
          optional: !property.is_required,
        },
      };
    }

    if (property.property_type === "DECIMAL") {
      const value = Number(propertyValue ? (propertyValue[0]?.values[0] ?? 0) : 0);

      return {
        key: propertyKey,
        label: propertyLabel,
        type: EWorkObjectFieldType.INTEGER,
        value: Math.floor(isNaN(value) ? 0 : value),
        edit: {
          enabled: true,
          optional: !property.is_required,
        },
      };
    }

    if (property.property_type === "OPTION") {
      const selectedOptions =
        propertyOptions && propertyValue
          ? propertyOptions.filter((option) => propertyValue[0]?.values.includes(option.id ?? ""))
          : [];

      // For multi select properties, we need to handle separately, by using an array
      if (property.is_multi) {
        return {
          key: propertyKey,
          label: propertyLabel,
          type: EWorkObjectFieldType.ARRAY,
          item_type: EWorkObjectFieldType.STRING,
          value: selectedOptions.map((option) => {
            return {
              value: option.name,
            };
          }),
          edit: {
            enabled: true,
            optional: !property.is_required,
            select: {
              fetch_options_dynamically: true,
              current_values: selectedOptions.map((option) => option.id ?? ""),
            },
          },
        };
      } else {
        return {
          key: propertyKey,
          label: propertyLabel,
          type: EWorkObjectFieldType.STRING,
          value: selectedOptions.length === 0 ? "No Selection" : selectedOptions[0].name,
          edit: {
            enabled: true,
            optional: !property.is_required,
            select: {
              fetch_options_dynamically: true,
              current_value: selectedOptions.length === 0 ? "" : (selectedOptions[0].id ?? ""),
            },
          },
        };
      }
    }

    if (property.property_type === "RELATION" && property.relation_type === "USER") {
      const members = additionalDetails.projectMembers;
      if (!members) {
        logger.info("[Slack WorkObjects] No members found, returning no selection");

        return {
          key: propertyKey,
          label: propertyLabel,
          type: EWorkObjectFieldType.STRING,
          value: "No Selection",
        };
      }

      const selectedMembers = propertyValue
        ? members.filter((member) => propertyValue[0]?.values.includes(member.id ?? ""))
        : [];

      if (property.is_multi) {
        return {
          key: propertyKey,
          label: propertyLabel,
          type: EWorkObjectFieldType.ARRAY,
          item_type: EWorkObjectFieldType.USER,
          value: selectedMembers.map((member) => {
            return {
              user: {
                // email: member.email,
                url: getUserProfileUrl(workspaceSlug, member.id),
                text: member.display_name,
                icon: member.avatar
                  ? {
                      alt_text: member.display_name,
                      url: member.avatar,
                    }
                  : undefined,
              },
            };
          }),
          edit: {
            enabled: true,
            optional: !property.is_required,
            select: {
              fetch_options_dynamically: true,
              current_values: selectedMembers.map((member) => member.id),
            },
          },
        };
      } else {
        const selectedMember = selectedMembers[0];
        if (!selectedMember) {
          return {
            key: propertyKey,
            label: propertyLabel,
            type: EWorkObjectFieldType.STRING,
            value: "No Selection",
            edit: {
              enabled: true,
            },
          };
        }

        return {
          key: propertyKey,
          label: propertyLabel,
          type: EWorkObjectFieldType.USER,
          user: {
            // email: selectedMembers[0].email,
            text: selectedMember.display_name,
            url: getUserProfileUrl(workspaceSlug, selectedMember.id),
            icon: selectedMember.avatar
              ? {
                  url: selectedMember.avatar,
                  alt_text: selectedMember.display_name,
                }
              : undefined,
          },
          edit: {
            enabled: true,
            optional: !property.is_required,
            select: {
              fetch_options_dynamically: true,
              current_value: selectedMembers[0].id,
            },
          },
        };
      }
    }

    const stringPropertyValue = propertyValue
      ?.map((value) => {
        return value.values;
      })
      .join(" ");

    return {
      label: property.display_name,
      key: propertyKey,
      type: EWorkObjectFieldType.STRING,
      value: stringPropertyValue ?? "",
      edit: {
        enabled: true,
        optional: !property.is_required,
      },
    };
  }
}
