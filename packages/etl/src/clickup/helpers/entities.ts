import { ExIssueAttachment, ExState } from "@plane/sdk";
import { E_IMPORTER_KEYS } from "@/core";
import {
  TClickUpPriorityConfig,
  TClickUpPriority,
  TClickUpStateConfig,
  TClickUpStatus,
  TClickUpAttachment,
  TClickUpComment,
  TClickUpTask,
} from "../types";
import { CLICKUP_ATTACHMENT_EXTERNAL_ID } from "./key";

export const getTargetState = (stateMap: TClickUpStateConfig[], sourceState: TClickUpStatus): ExState | undefined => {
  if (!sourceState || !sourceState.id) {
    return undefined;
  }

  const targetMapping = stateMap.find((state: TClickUpStateConfig) => state.source_state.id === sourceState.id);
  if (!targetMapping) {
    return undefined;
  }

  // If the mapping does not have a valid target_state, we cannot proceed safely.
  // Return undefined and let the caller decide how to handle missing mappings.
  if (!targetMapping.target_state) {
    console.warn(
      `[ETL][CLICKUP] Missing target_state while transforming state mapping for source_state id ${sourceState.id}`
    );
    return undefined;
  }

  // Do not mutate original mapping object; instead create a copy with the required metadata
  return {
    ...targetMapping.target_state,
    external_source: E_IMPORTER_KEYS.CLICKUP,
    external_id: sourceState.id as string,
  } as ExState;
};

export const getTargetPriority = (
  priorityMap: TClickUpPriorityConfig[],
  sourcePriority: TClickUpPriority | null
): string | undefined => {
  if (!sourcePriority || !sourcePriority.id) {
    return undefined;
  }

  const targetPriority = priorityMap.find(
    (priority: TClickUpPriorityConfig) => priority.source_priority.id === sourcePriority.id
  );
  return targetPriority?.target_priority;
};

export const getTargetAttachments = (
  spaceId: string,
  folderId: string,
  attachments?: TClickUpAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map((attachment: TClickUpAttachment): Partial<ExIssueAttachment | undefined> => {
      if (!attachment.id) {
        return;
      }

      return {
        external_id: CLICKUP_ATTACHMENT_EXTERNAL_ID(spaceId, folderId, attachment.id),
        external_source: E_IMPORTER_KEYS.CLICKUP,
        attributes: {
          name: attachment.title ?? "Untitled",
          size: attachment.size ?? 0,
        },
        asset: attachment.url ?? "",
      };
    })
    .filter((attachment) => attachment !== undefined) as ExIssueAttachment[];

  return attachmentArray;
};

export const getCommentHTML = (comment: TClickUpComment): string => {
  let html = "<div>\n";

  for (const item of comment.comment) {
    if (item.type === "image" && item.image?.url) {
      html += `  <img src="${item.image.url}" alt="" />\n`;
    }
  }

  html += `  <p>${comment.comment_text}</p>\n</div>`;
  return html;
};

export const getUniqueTasks = (tasks: TClickUpTask[]): TClickUpTask[] => {
  const uniqueTaskIds = new Set<string>();
  const uniqueTasks: TClickUpTask[] = [];
  for (const task of tasks) {
    if (uniqueTaskIds.has(task.id)) {
      continue;
    }
    uniqueTaskIds.add(task.id);
    uniqueTasks.push(task);
  }
  return uniqueTasks;
};
