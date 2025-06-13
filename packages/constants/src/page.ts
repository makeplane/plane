export const EPageAccess = {
  PUBLIC: 0,
  PRIVATE: 1,
} as const;

export type EPageAccess = typeof EPageAccess[keyof typeof EPageAccess];

export type TCreatePageModal = {
  isOpen: boolean;
  pageAccess?: EPageAccess;
};

export const DEFAULT_CREATE_PAGE_MODAL_DATA: TCreatePageModal = {
  isOpen: false,
  pageAccess: EPageAccess.PUBLIC,
};
