export const ECardVariant = {
  WITHOUT_SHADOW: "without-shadow",
  WITH_SHADOW: "with-shadow",
} as const;

export type ECardVariant = typeof ECardVariant[keyof typeof ECardVariant];

export const ECardDirection = {
  ROW: "row",
  COLUMN: "column",
} as const;

export type ECardDirection = typeof ECardDirection[keyof typeof ECardDirection];

export const ECardSpacing = {
  SM: "sm",
  LG: "lg",
} as const;

export type ECardSpacing = typeof ECardSpacing[keyof typeof ECardSpacing];

export type TCardVariant = typeof ECardVariant.WITHOUT_SHADOW | typeof ECardVariant.WITH_SHADOW;
export type TCardDirection = typeof ECardDirection.ROW | typeof ECardDirection.COLUMN;
export type TCardSpacing = typeof ECardSpacing.SM | typeof ECardSpacing.LG;

const DEFAULT_STYLE =
  "bg-custom-background-100 rounded-lg border-[0.5px] border-custom-border-200 w-full flex flex-col";
export const containerStyle: Record<ECardVariant, string> = {
  [ECardVariant.WITHOUT_SHADOW]: "",
  [ECardVariant.WITH_SHADOW]: "hover:shadow-custom-shadow-4xl duration-300",
};
export const spacings: Record<ECardSpacing, string> = {
  [ECardSpacing.SM]: "p-4",
  [ECardSpacing.LG]: "p-6",
};
export const directions: Record<ECardDirection, string> = {
  [ECardDirection.ROW]: "flex-row space-x-3",
  [ECardDirection.COLUMN]: "flex-col space-y-3",
};
export const getCardStyle = (variant: TCardVariant, spacing: TCardSpacing, direction: TCardDirection) =>
  DEFAULT_STYLE + " " + directions[direction] + " " + containerStyle[variant] + " " + spacings[spacing];
