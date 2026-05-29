// local imports
import type { TPowerKContext, TPowerKPageType } from "@/components/power-k/core/types";

export type TPowerKOpenEntityActionsProps = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  handleSelection: (data: unknown) => void;
};
