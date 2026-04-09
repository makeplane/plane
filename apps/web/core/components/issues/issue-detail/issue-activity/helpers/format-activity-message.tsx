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

import { Bold } from "./activity-message-components";

/**
 * Pure function that maps (field, verb, oldValue, newValue) to a ReactNode message.
 * Mirrors the text patterns from the individual web action components.
 */
export function ActivityMessage({
  field,
  verb,
  oldValue,
  newValue,
}: {
  field: string | null;
  verb: string;
  oldValue?: string;
  newValue?: string;
}) {
  switch (field) {
    case null:
      return verb === "created" ? "created the work item." : "deleted a work item.";

    case "state":
      return (
        <>
          set the state to <Bold value={newValue} />.
        </>
      );

    case "workflow_state_removed":
      return (
        <>
          moved this work item to <Bold value={newValue} /> because the <Bold value={oldValue} /> state was removed from
          the workflow.
        </>
      );

    case "workflow_approved":
      return (
        <>
          approved this work item. State updated to <Bold value={newValue} />.
        </>
      );

    case "workflow_rejected":
      return (
        <>
          rejected this work item. State updated to <Bold value={newValue} />.
        </>
      );

    case "priority":
      return (
        <>
          set the priority to <Bold value={newValue} />.
        </>
      );

    case "assignees":
      if (oldValue === "") {
        return (
          <>
            added a new assignee <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the assignee <Bold value={oldValue} />.
        </>
      );

    case "name":
      return <>set the name to {newValue}.</>;

    case "description":
      return "updated the description.";

    case "start_date":
      if (newValue) {
        return (
          <>
            set the start date to <Bold value={newValue} />.
          </>
        );
      }
      return "removed the start date.";

    case "target_date":
      if (newValue) {
        return (
          <>
            set the due date to <Bold value={newValue} />.
          </>
        );
      }
      return "removed the due date.";

    case "labels":
      if (oldValue === "") {
        return (
          <>
            added a new label <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the label <Bold value={oldValue} />.
        </>
      );

    case "estimate_points":
    case "estimate_categories":
    case "estimate_point":
      if (newValue) {
        return (
          <>
            set the estimate point to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the estimate point <Bold value={oldValue} />.
        </>
      );

    case "estimate_time":
      if (newValue) {
        return (
          <>
            set the time estimate to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the time estimate <Bold value={oldValue} />.
        </>
      );

    case "parent":
      if (newValue) {
        return (
          <>
            set the parent to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the parent <Bold value={oldValue} />.
        </>
      );

    case "link":
      if (verb === "created") {
        return <>added a link.</>;
      }
      if (verb === "updated") {
        return <>updated a link.</>;
      }
      return "removed a link.";

    case "attachment":
      return verb === "created" ? "uploaded a new attachment." : "removed an attachment.";

    case "archived_at":
      if (newValue === "restore") {
        return "restored the work item.";
      }
      return "archived the work item.";

    case "intake":
    case "inbox": {
      switch (verb) {
        case "-1":
          return "declined this work item from intake.";
        case "0":
          return "snoozed this work item.";
        case "1":
          return "accepted this work item from intake.";
        case "2":
          return "declined this work item from intake by marking a duplicate work item.";
        default:
          return "updated intake work item status.";
      }
    }

    case "type":
      if (newValue && oldValue) {
        return (
          <>
            changed work item type to <Bold value={newValue} /> from <Bold value={oldValue} />.
          </>
        );
      }
      if (newValue) {
        return (
          <>
            set the work item type to <Bold value={newValue} />.
          </>
        );
      }
      return "updated the work item type.";

    case "page":
      if (verb === "added") {
        return (
          <>
            added a new page <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the page <Bold value={newValue || oldValue} />.
        </>
      );

    case "cycles":
      if (verb === "created") {
        return (
          <>
            added this work item to the cycle <Bold value={newValue} />.
          </>
        );
      }
      if (verb === "updated") {
        return (
          <>
            set the cycle to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the work item from the cycle <Bold value={newValue || oldValue} />.
        </>
      );

    case "modules":
      if (verb === "created") {
        return (
          <>
            added this work item to the module <Bold value={newValue} />.
          </>
        );
      }
      if (verb === "updated") {
        return (
          <>
            set the module to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the work item from the module <Bold value={oldValue} />.
        </>
      );

    case "milestones":
      if (verb === "created") {
        return (
          <>
            added this work item to the milestone <Bold value={newValue} />.
          </>
        );
      }
      if (verb === "updated") {
        return (
          <>
            changed the milestone to <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the work item from the milestone <Bold value={oldValue} />.
        </>
      );

    case "customer":
      if (verb === "created") {
        return (
          <>
            added this work item to the customer <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the work item from the customer <Bold value={oldValue} />.
        </>
      );

    case "customer_request":
      if (verb === "created") {
        return (
          <>
            added this work item to the customer request <Bold value={newValue} />.
          </>
        );
      }
      return (
        <>
          removed the work item from the customer request <Bold value={oldValue} />.
        </>
      );

    case "epic":
      if (verb === "created") {
        return "created the epic.";
      }
      return "converted to work item.";

    case "work_item":
      return "converted to epic.";

    case "hierarchy_break":
      return (
        <>
          removed the parent <Bold value={oldValue} /> during hierarchy changes.
        </>
      );

    default:
      // Generic fallback for unknown fields
      if (newValue && oldValue) {
        return (
          <>
            updated the {field} from <Bold value={oldValue} /> to <Bold value={newValue} />.
          </>
        );
      }
      if (newValue) {
        return (
          <>
            set the {field} to <Bold value={newValue} />.
          </>
        );
      }
      if (oldValue) {
        return (
          <>
            removed the {field} <Bold value={oldValue} />.
          </>
        );
      }
      return <>updated the {field}.</>;
  }
}
