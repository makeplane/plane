import { TInstanceNotReady } from "@plane/types";

export enum EInstanceStatus {
  ERROR = "ERROR",
  NOT_YET_READY = "NOT_YET_READY",
}

export type TInstanceStatus = {
  status: EInstanceStatus | undefined;
  data?: TInstanceNotReady;
};
