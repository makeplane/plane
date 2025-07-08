// this file contains the functions to generate external ids/keys for clickup entities

export const CLICKUP_TASK_EXTERNAL_ID = (taskId: string) => taskId;

export const CLICKUP_TASK_COMMENT_EXTERNAL_ID = (
  spaceId: string,
  folderId: string,
  taskId: string,
  commentId: string
) => `${spaceId}-${folderId}-${taskId}-${commentId}`;

export const CLICKUP_LIST_EXTERNAL_ID = (spaceId: string, folderId: string, listId: string) =>
  `${spaceId}-${folderId}-${listId}`;

export const CLICKUP_TASK_TYPE_EXTERNAL_ID = (spaceId: string, folderId: string, taskTypeId: string) =>
  `${spaceId}-${folderId}-${taskTypeId}`;

export const CLICKUP_TASK_CUSTOM_FIELD_EXTERNAL_ID = (
  spaceId: string,
  folderId: string,
  taskTypeId: string,
  customFieldId: string
) => `${spaceId}-${folderId}-${taskTypeId}-${customFieldId}`;

export const CLICKUP_TASK_CUSTOM_FIELD_OPTION_EXTERNAL_ID = (
  spaceId: string,
  folderId: string,
  taskTypeId: string,
  customFieldId: string,
  customFieldOptionId: string
) => `${spaceId}-${folderId}-${taskTypeId}-${customFieldId}-${customFieldOptionId}`;

export const CLICKUP_ATTACHMENT_EXTERNAL_ID = (spaceId: string, folderId: string, attachmentId: string) =>
  `${spaceId}-${folderId}-${attachmentId}`;

export const CLICKUP_USER_EXTERNAL_ID = (spaceId: string, folderId: string, userId: string) =>
  `${spaceId}-${folderId}-${userId}`;

export const CLICKUP_PROJECT_EXTERNAL_ID = (spaceId: string, folderId: string) => `${spaceId}-${folderId}`;

export const CLICKUP_STATE_EXTERNAL_ID = (spaceId: string, folderId: string, stateId: string) =>
  `${spaceId}-${folderId}-${stateId}`;
