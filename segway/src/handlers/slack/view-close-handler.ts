import { TViewClosedPayload } from "types/slack";

export const handleViewClosed = async (
  payload: TViewClosedPayload,
): Promise<boolean> => {
  return true;
};
