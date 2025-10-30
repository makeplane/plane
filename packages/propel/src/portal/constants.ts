export enum EPortalWidth {
  QUARTER = "quarter",
  HALF = "half",
  THREE_QUARTER = "three-quarter",
  FULL = "full",
}

export enum EPortalPosition {
  LEFT = "left",
  RIGHT = "right",
  CENTER = "center",
}

export const PORTAL_WIDTH_CLASSES = {
  [EPortalWidth.QUARTER]: "w-1/4 min-w-80 max-w-96",
  [EPortalWidth.HALF]: "w-1/2 min-w-96 max-w-2xl",
  [EPortalWidth.THREE_QUARTER]: "w-3/4 min-w-96 max-w-5xl",
  [EPortalWidth.FULL]: "w-full",
} as const;

export const PORTAL_POSITION_CLASSES = {
  [EPortalPosition.LEFT]: "left-0",
  [EPortalPosition.RIGHT]: "right-0",
  [EPortalPosition.CENTER]: "left-1/2 -translate-x-1/2",
} as const;

export const DEFAULT_PORTAL_ID = "full-screen-portal";
export const MODAL_Z_INDEX = 25;
