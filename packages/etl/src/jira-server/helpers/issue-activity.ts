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
  resourceId: string,
  projectId: string,
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
      // handle identifiers - done
      const oldStateExternalId = `${projectId}_${resourceId}_${oldIdentifier}`;
      const newStateExternalId = `${projectId}_${resourceId}_${newIdentifier}`;
      const oldStatePlaneId = oldIdentifier ? transformationMaps.stateMap.get(oldStateExternalId) : null;
      const newStatePlaneId = newIdentifier ? transformationMaps.stateMap.get(newStateExternalId) : null;
      return [
        {
          field: "state",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          old_identifier: oldStatePlaneId,
          new_identifier: newStatePlaneId,
          comment: "updated the state to",
        },
      ];
    }
    case "assignees": {
      // Emit raw Jira account keys as identifiers; resolution to Plane user IDs happens
      // downstream in the silo migrator (processActivities) against the USERS mapping.
      const activities: Partial<TActivityItemResult>[] = [];
      // since jira has single assignee field and sends removal and addition in same activity,
      // we need to handle 2 events separately for Plane issue activities
      if (oldValue) {
        activities.push({
          field: "assignees",
          verb: "updated",
          old_value: oldValue,
          new_value: "",
          old_identifier: oldIdentifier,
          comment: "removed assignee",
        });
      }
      if (newValue) {
        activities.push({
          field: "assignees",
          verb: "updated",
          old_value: "",
          new_value: newValue,
          new_identifier: newIdentifier,
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
      const oldPriorityExternalId = `${projectId}_${resourceId}_${oldIdentifier}`;
      const newPriorityExternalId = `${projectId}_${resourceId}_${newIdentifier}`;
      const oldPriority = oldValue ? transformationMaps.priorityMap.get(oldPriorityExternalId) : "";
      const newPriority = newValue ? transformationMaps.priorityMap.get(newPriorityExternalId) : "";
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
      // handle identifiers
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
            old_value: "",
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
            new_value: "",
            comment: "removed label",
          });
        });
      }
      return labelActivities;
    }
    case "cycles": {
      // handle identifiers
      const { valuesAdded, valuesRemoved, externalIdsAdded, externalIdsRemoved } = getIdAndValueDifferences(
        oldValue,
        newValue,
        oldIdentifier,
        newIdentifier,
        projectId,
        resourceId
      );
      const cycleActivities: Partial<TActivityItemResult>[] = [];
      if (valuesAdded.length > 0) {
        valuesAdded.forEach((cycle, index) => {
          cycleActivities.push({
            field: "cycles",
            verb: "created",
            old_value: "",
            new_value: cycle,
            comment: `added cycle ${cycle}`,
            old_identifier: null,
            new_identifier: newIdentifier ? transformationMaps.cycleMap.get(externalIdsAdded[index]) : null,
          });
        });
      }
      if (valuesRemoved.length > 0) {
        valuesRemoved.forEach((cycle, index) => {
          cycleActivities.push({
            field: "cycles",
            verb: "deleted",
            old_value: cycle,
            new_value: "",
            comment: `removed this issue from cycle ${cycle}`,
            old_identifier: oldIdentifier ? transformationMaps.cycleMap.get(externalIdsRemoved[index]) : null,
            new_identifier: null,
          });
        });
      }
      return cycleActivities;
    }
    case "type": {
      // handle identifiers
      const oldIssueTypeExternalId = `${projectId}_${resourceId}_${oldIdentifier}`;
      const newIssueTypeExternalId = `${projectId}_${resourceId}_${newIdentifier}`;
      const oldIssueTypePlaneId = oldIdentifier ? transformationMaps.issueTypeMap.get(oldIssueTypeExternalId) : null;
      const newIssueTypePlaneId = newIdentifier ? transformationMaps.issueTypeMap.get(newIssueTypeExternalId) : null;
      return [
        {
          field: "type",
          verb: "updated",
          old_value: oldValue,
          new_value: newValue,
          old_identifier: oldIssueTypePlaneId,
          new_identifier: newIssueTypePlaneId,
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
          old_value: "",
          new_value: "",
          comment: newValue ? "created a link" : "deleted the link",
        },
      ];

    case "attachment": {
      // handle identifiers
      const oldAttachmentExternalId = `${projectId}_${resourceId}_${oldIdentifier}`;
      const newAttachmentExternalId = `${projectId}_${resourceId}_${newIdentifier}`;
      const oldAttachmentPlaneId = oldIdentifier ? transformationMaps.attachmentMap.get(oldAttachmentExternalId) : null;
      const newAttachmentPlaneId = newIdentifier ? transformationMaps.attachmentMap.get(newAttachmentExternalId) : null;
      return [
        {
          field: "attachment",
          verb: newValue ? "created" : "deleted",
          old_value: oldValue,
          new_value: newValue,
          comment: newValue ? "created an attachment" : "deleted the attachment",
          old_identifier: oldAttachmentPlaneId,
          new_identifier: newAttachmentPlaneId,
        },
      ];
    }
    case "modules": {
      // handle identifiers
      const { valuesAdded, valuesRemoved, externalIdsAdded, externalIdsRemoved } = getIdAndValueDifferences(
        oldValue,
        newValue,
        oldIdentifier,
        newIdentifier,
        projectId,
        resourceId
      );
      const moduleActivities: Partial<TActivityItemResult>[] = [];
      if (valuesAdded.length > 0) {
        valuesAdded.forEach((module, index) => {
          moduleActivities.push({
            field: "modules",
            verb: "created",
            old_value: "",
            new_value: module,
            comment: `added module ${module}`,
            old_identifier: null,
            new_identifier: newIdentifier ? transformationMaps.moduleMap.get(externalIdsAdded[index]) : null,
          });
        });
      }
      if (valuesRemoved.length > 0) {
        valuesRemoved.forEach((module, index) => {
          moduleActivities.push({
            field: "modules",
            verb: "deleted",
            old_value: module,
            new_value: "",
            comment: `removed this issue from module ${module}`,
            old_identifier: oldIdentifier ? transformationMaps.moduleMap.get(externalIdsRemoved[index]) : null,
            new_identifier: null,
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
          old_value: oldIdentifier ?? "",
          new_value: newIdentifier ?? "",
          comment: newValue ? "added relates_to relation" : "deleted relates_to relation",
        },
      ];

    default:
      return [];
  }
};

const getIdAndValueDifferences = (
  oldValue: string | null,
  newValue: string | null,
  oldIdentifier: string | null,
  newIdentifier: string | null,
  projectId: string,
  resourceId: string
): { valuesAdded: string[]; valuesRemoved: string[]; externalIdsAdded: string[]; externalIdsRemoved: string[] } => {
  const oldValueArray = oldValue ? oldValue.split(",").map((id) => id.trim()) : [];
  const newValueArray = newValue ? newValue.split(",").map((id) => id.trim()) : [];

  const valuesAdded = newValueArray.filter((id) => !oldValueArray.includes(id));
  const valuesRemoved = oldValueArray.filter((id) => !newValueArray.includes(id));

  const oldIds = oldIdentifier ? oldIdentifier.split(",").map((id) => id.trim()) : [];
  const newIds = newIdentifier ? newIdentifier.split(",").map((id) => id.trim()) : [];
  const idsAdded = newIds.filter((id) => !oldIds.includes(id));
  const idsRemoved = oldIds.filter((id) => !newIds.includes(id));

  const externalIdsAdded = idsAdded.map((id) => `${projectId}_${resourceId}_${id}`);
  const externalIdsRemoved = idsRemoved.map((id) => `${projectId}_${resourceId}_${id}`);

  return { valuesAdded, valuesRemoved, externalIdsAdded, externalIdsRemoved };
};
