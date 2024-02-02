import { TView } from "@plane/types";

export type TViewOperations = {
  create: (data: Partial<TView>) => void;
  fetch: () => void;
};
