import type { TBlockNodeBaseAttributes } from "../unique-id/types";

export type TCodeBlockAttributes = TBlockNodeBaseAttributes & {
  language: string | null;
};
