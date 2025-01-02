import { CycleQuickActionArchive, CycleQuickActionEdit } from ".";

export const QUICK_ACTION_ITEMS = {
  archive: {
    title: "Archive",
    component: CycleQuickActionArchive,
  },
  edit: {
    title: "Edit",
    component: CycleQuickActionEdit,
  },
};

export const QUICK_ACTION_MENU_ITEMS = [QUICK_ACTION_ITEMS.archive, QUICK_ACTION_ITEMS.edit];
