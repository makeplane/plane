export const EInstanceStatus = {
  ERROR: "ERROR",
  NOT_YET_READY: "NOT_YET_READY",
} as const;

export type EInstanceStatus = typeof EInstanceStatus[keyof typeof EInstanceStatus];

export type TInstanceStatus = {
  status: EInstanceStatus | undefined;
  data?: object;
};
