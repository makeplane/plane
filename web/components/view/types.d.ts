import { LucideIcon } from "lucide-react";
// types
import { TView, TUpdateView } from "@plane/types";

export type TViewOperations = {
  localViewCreateEdit: (viewId: string | undefined, currentView?: TUpdateView | undefined) => void;
  localViewCreateEditClear: (viewId: string | undefined) => Promise<void>;

  fetch: () => Promise<void>;
  create: (data: Partial<TView>) => Promise<void>;
  update: () => Promise<void>;
  remove: (viewId: string) => Promise<void>;
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
