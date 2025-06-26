export enum EPageAccess {
  PUBLIC = 0,
  PRIVATE = 1,
}

export enum EPageSharedUserAccess {
  VIEW = 0,
  COMMENT = 1,
  EDIT = 2,
}

export type TCreatePageModal = {
  isOpen: boolean;
  pageAccess?: EPageAccess;
};

export const DEFAULT_CREATE_PAGE_MODAL_DATA: TCreatePageModal = {
  isOpen: false,
  pageAccess: EPageAccess.PUBLIC,
};
