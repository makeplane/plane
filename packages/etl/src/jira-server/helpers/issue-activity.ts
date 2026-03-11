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

import type { ChangeDetails as JiraChangeDetails } from "jira.js/out/version2/models/index.js";
import type { ExIssueActivity } from "@plane/sdk";
import type { TTransformationMaps } from "../types";

type TActivityItemResult = Pick<
  ExIssueActivity,
  "field" | "verb" | "old_value" | "new_value" | "comment" | "old_identifier" | "new_identifier"
>;

const JIRA_FIELD_TO_PLANE_FIELD: Record<string, string> = {
  status: "state",
  assignee: "assignees",
  summary: "name",
  description: "description",
  priority: "priority",
  labels: "labels",
  sprint: "cycles",
  component: "modules",
  issuetype: "type",
  "target start": "start_date",
  "target end": "target_date",
  attachment: "attachment",
  link: "relates_to",
  "epic link": "parent",
  remoteissuelink: "link",
};

export const mapJiraFieldToPlaneField = (jiraField: string): string | undefined =>
  JIRA_FIELD_TO_PLANE_FIELD[jiraField.toLowerCase()];

export const transformActivityItem = (
  item: JiraChangeDetails,
  transformationMaps: TTransformationMaps
): Partial<TActivityItemResult>[] => {
  const fieldName = (item.field ?? "").toLowerCase();
  const planeField = JIRA_FIELD_TO_PLANE_FIELD[fieldName];

  if (!planeField) return [];

  const oldValue = item.fromString ?? null;
  const newValue = item.toString ?? null;
  const oldIdentifier = item.from ?? null;
  const newIdentifier = item.to ?? null;

  // TODO: use identifiers by using lookup maps

  switch (planeField) {
    case "state": {
      const oldState = oldIdentifier ? transformationMaps.stateMap[oldIdentifier] : null;
      const newState = newIdentifier ? transformationMaps.stateMap[newIdentifier] : null;
      return [
        {
          field: "state",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          old_identifier: oldState?.id,
          new_identifier: newState?.id,
          comment: "updated the state to",
        },
      ];
    }
    case "assignees": {
      const oldAssignee = oldIdentifier ? transformationMaps.userMap[oldIdentifier] : null;
      const newAssignee = newIdentifier ? transformationMaps.userMap[newIdentifier] : null;
      const activities: Partial<TActivityItemResult>[] = [];
      // since jira has single assignee field and sends removal and addition in same activity,
      // we need to handle 2 events separately for Plane issue activities
      if (oldValue) {
        activities.push({
          field: "assignees",
          verb: "updated",
          old_value: oldValue,
          new_value: null,
          old_identifier: oldAssignee?.id,
          comment: "removed assignee",
        });
      }
      if (newValue) {
        activities.push({
          field: "assignees",
          verb: "updated",
          old_value: null,
          new_value: newValue,
          new_identifier: newAssignee?.id,
          comment: "added assignee",
        });
      }
      return activities;
    }
    case "name":
      return [
        {
          field: "name",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          comment: "updated the name to",
        },
      ];

    case "description":
      return [
        {
          field: "description",
          verb: "updated",
          old_value: oldValue ?? "",
          new_value: newValue ?? "",
          comment: "updated the description to",
        },
      ];

    case "priority": {
      const oldPriority = oldValue ? transformationMaps.priorityMap[oldValue] : null;
      const newPriority = newValue ? transformationMaps.priorityMap[newValue] : null;
      return [
        {
          field: "priority",
          verb: "updated",
          old_value: oldPriority,
          new_value: newPriority,
          comment: `updated the priority to ${newValue ?? ""}`,
        },
      ];
    }
    case "labels": {
      // skipping identifiers as label map won't be available yet
      // can improve by importing labels in a prev step and using identifiers
      const newLabels = newValue ? newValue.split(" ") : [];
      const oldLabels = oldValue ? oldValue.split(" ") : [];
      const labelsAdded = newLabels.filter((label) => !oldLabels.includes(label));
      const labelsRemoved = oldLabels.filter((label) => !newLabels.includes(label));
      const labelActivities: Partial<TActivityItemResult>[] = [];
      if (labelsAdded.length > 0) {
        labelsAdded.forEach((label) => {
          labelActivities.push({
            field: "labels",
            verb: "updated",
            old_value: null,
            new_value: label,
            comment: "added label",
          });
        });
      }
      if (labelsRemoved.length > 0) {
        labelsRemoved.forEach((label) => {
          labelActivities.push({
            field: "labels",
            verb: "updated",
            old_value: label,
            new_value: null,
            comment: "removed label",
          });
        });
      }
      return labelActivities;
    }
    case "cycles": {
      const oldCycles = oldValue ? oldValue.split(",").map((cy) => cy.trim()) : [];
      const newCycles = newValue ? newValue.split(",").map((cy) => cy.trim()) : [];
      const cyclesAdded = newCycles.filter((cycle) => !oldCycles.includes(cycle));
      const cyclesRemoved = oldCycles.filter((cycle) => !newCycles.includes(cycle));
      const cycleActivities: Partial<TActivityItemResult>[] = [];
      if (cyclesAdded.length > 0) {
        cyclesAdded.forEach((cycle) => {
          cycleActivities.push({
            field: "cycles",
            verb: "created",
            old_value: null,
            new_value: cycle,
            comment: `added cycle ${cycle}`,
          });
        });
      }
      if (cyclesRemoved.length > 0) {
        cyclesRemoved.forEach((cycle) => {
          cycleActivities.push({
            field: "cycles",
            verb: "deleted",
            old_value: cycle,
            new_value: null,
            comment: `removed this issue from cycle ${cycle}`,
          });
        });
      }
      return cycleActivities;
    }
    case "type": {
      const oldIssueType = oldIdentifier ? transformationMaps.issueTypeMap[oldIdentifier] : null;
      const newIssueType = newIdentifier ? transformationMaps.issueTypeMap[newIdentifier] : null;
      return [
        {
          field: "type",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          old_identifier: oldIssueType?.id,
          new_identifier: newIssueType?.id,
          comment: `updated the issue type from ${oldValue ?? ""} to ${newValue ?? ""}`,
        },
      ];
    }
    case "start_date":
      return [
        {
          field: "start_date",
          verb: "updated",
          old_value: oldIdentifier,
          new_value: newIdentifier,
          comment: "updated the start date to",
        },
      ];

    case "target_date":
      return [
        {
          field: "target_date",
          verb: "updated",
          old_value: oldIdentifier,
          new_value: newIdentifier,
          comment: "updated the target date to",
        },
      ];

    case "link":
      return [
        {
          field: "link",
          verb: newValue ? "created" : "deleted",
          old_value: null,
          new_value: null,
          comment: newValue ? "created a link" : "deleted the link",
        },
      ];

    case "attachment": {
      // handle identifiers
      const oldAttachment = oldIdentifier ? transformationMaps.attachmentMap[oldIdentifier] : null;
      const newAttachment = newIdentifier ? transformationMaps.attachmentMap[newIdentifier] : null;
      return [
        {
          field: "attachment",
          verb: newValue ? "created" : "deleted",
          old_value: oldValue,
          new_value: newValue,
          comment: newValue ? "created an attachment" : "deleted the attachment",
          old_identifier: oldAttachment?.id,
          new_identifier: newAttachment?.id,
        },
      ];
    }
    case "modules": {
      const oldModules = oldValue ? oldValue.split(",").map((md) => md.trim()) : [];
      const newModules = newValue ? newValue.split(",").map((md) => md.trim()) : [];
      const modulesAdded = newModules.filter((module) => !oldModules.includes(module));
      const modulesRemoved = oldModules.filter((module) => !newModules.includes(module));
      const moduleActivities: Partial<TActivityItemResult>[] = [];
      if (modulesAdded.length > 0) {
        modulesAdded.forEach((module) => {
          moduleActivities.push({
            field: "modules",
            verb: "created",
            old_value: null,
            new_value: module,
            comment: `added module ${module}`,
          });
        });
      }
      if (modulesRemoved.length > 0) {
        modulesRemoved.forEach((module) => {
          moduleActivities.push({
            field: "modules",
            verb: "deleted",
            old_value: module,
            new_value: null,
            comment: `removed this issue from module ${module}`,
          });
        });
      }
      return moduleActivities;
    }
    case "parent":
      // skipping identifiers as issue map won't be available yet
      return [
        {
          field: "parent",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          comment: "updated the parent issue to",
        },
      ];

    case "relates_to":
      // skipping identifiers as issue map won't be available yet
      return [
        {
          field: "relates_to",
          verb: newValue ? "created" : "deleted",
          old_value: oldValue,
          new_value: newValue,
          comment: newValue ? "added relates_to relation" : "deleted relates_to relation",
        },
      ];

    default:
      return [];
  }
};
