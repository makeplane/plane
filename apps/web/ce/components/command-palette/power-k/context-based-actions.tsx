// components
import type { TPowerKPageKeys } from "@/components/command-palette/power-k/types";

export type PowerKContextBasedActionsExtendedProps = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKContextBasedActionsExtended: React.FC<PowerKContextBasedActionsExtendedProps> = () => null;
