import { IPriorityConfig, IStateConfig, PaginatedResponse } from "@/types";
import { ExIssueAttachment, ExState } from "@plane/sdk";
import {
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version3/models";

export const getTargetState = (
  stateMap: IStateConfig[],
  sourceState: JiraState
): ExState | undefined => {
  // Assign the external source and external id from jira and return the target state
  const targetState = stateMap.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = "JIRA";
      state.target_state.external_id = sourceState.id as string;
      return state;
    }
  });

  return targetState?.target_state;
};

export const getTargetAttachments = (
  attachments?: JiraAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map((attachment: JiraAttachment): Partial<ExIssueAttachment> => {
      return {
        external_id: attachment.id ?? "",
        external_source: "JIRA",
        attributes: {
          name: attachment.filename ?? "Untitled",
          size: attachment.size ?? 0,
        },
        asset: attachment.content ?? "",
      };
    })
    .filter((attachment) => attachment !== undefined) as ExIssueAttachment[];

  return attachmentArray;
};

export const getTargetPriority = (
  priorityMap: IPriorityConfig[],
  sourcePriority: JiraPriority
): string | undefined => {
  const targetPriority = priorityMap.find(
    (priority: IPriorityConfig) =>
      priority.source_priority.name === sourcePriority.name
  );
  return targetPriority?.target_priority;
};

export const fetchPaginatedData = async <T>(
  fetchFunction: (startAt: number) => Promise<PaginatedResponse>,
  processFunction: (values: T[]) => void,
  listPropertyName: string
) => {
  let hasMore = true;
  let startAt = 0;
  let total = 0;

  while (hasMore) {
    const response = await fetchFunction(startAt);
    const values = response[listPropertyName] as T[]; // Type assertion
    if (response.total == 0) {
      break;
    }
    if (response && response.total && values) {
      total = response.total;
      processFunction(values);
      startAt += values.length;
      if (response.total <= startAt) {
        hasMore = false;
      }
    }
  }
};
