import { LucideIcon } from "lucide-react";
// types
import { TView, TUpdateView } from "@plane/types";
// constants
import { TViewCRUD } from "constants/view";

export type TViewOperations = {
  localViewCreateEdit: (viewId: string | undefined, status: TViewCRUD) => void;

  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
  update: () => Promise<void>;
  remove: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

// view and view filter edit dropdowns
export type TViewEditDropdownOptions = {
  icon: LucideIcon;
  key: string;
  label: string;
  onClick: () => void;
  children: TViewEditDropdownOptions[] | undefined;
};

export type TViewFilterEditDropdownOptions = {
  icon: LucideIcon | any;
  key: string;
  label: string;
  onClick: () => void;
};
