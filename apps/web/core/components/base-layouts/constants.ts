import { BoardLayoutIcon, ListLayoutIcon } from "@plane/propel/icons";
import type { IBaseLayoutConfig } from "@plane/types";

export const BASE_LAYOUTS: IBaseLayoutConfig[] = [
  {
    key: "list",
    icon: ListLayoutIcon,
    label: "List Layout",
  },
  {
    key: "kanban",
    icon: BoardLayoutIcon,
    label: "Board Layout",
  },
];
