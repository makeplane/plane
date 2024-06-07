export enum EErrorCodes {
  "INVALID_ARCHIVE_STATE_GROUP" = 4091,
  "INVALID_ISSUE_START_DATE" = 4101,
  "INVALID_ISSUE_TARGET_DATE" = 4102,
}

export const ERROR_DETAILS: {
  [key in EErrorCodes]: {
    title: string;
    message: string;
  };
} = {
  [EErrorCodes.INVALID_ARCHIVE_STATE_GROUP]: {
    title: "Unable to archive issues",
    message: "Only issues belonging to Completed or Canceled state groups can be archived.",
  },
  [EErrorCodes.INVALID_ISSUE_START_DATE]: {
    title: "Unable to update issues",
    message: "Start date selected succeeds the due date for some issues. Ensure start date to be before the due date.",
  },
  [EErrorCodes.INVALID_ISSUE_TARGET_DATE]: {
    title: "Unable to update issues",
    message: "Due date selected precedes the start date for some issues. Ensure due date to be after the start date.",
  },
};
