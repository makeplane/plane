import { TInitiativeLink } from "@/plane-web/types/initiative";

export type TLinkOperations = {
  create: (data: Partial<TInitiativeLink>) => Promise<void>;
  update: (linkId: string, data: Partial<TInitiativeLink>) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};
