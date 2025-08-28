import { TAutomation } from "./root";

export type TCreateUpdateModalPayload = (Partial<TAutomation> & { id: string }) | null;

export type TCreateUpdateModalConfig = {
  isOpen: boolean;
  payload: TCreateUpdateModalPayload;
};
