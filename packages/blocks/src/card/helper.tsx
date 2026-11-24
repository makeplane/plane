/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type CardVariant = "without-shadow" | "with-shadow";

/** @deprecated Use CardVariant instead. */
export type TCardVariant = CardVariant;

export type CardDirection = "row" | "column";

/** @deprecated Use CardDirection instead. */
export type TCardDirection = CardDirection;

export type CardSpacing = "sm" | "lg";

/** @deprecated Use CardSpacing instead. */
export type TCardSpacing = CardSpacing;

export type CardVariantClassNameMap = Record<CardVariant, string>;
export type CardSpacingClassNameMap = Record<CardSpacing, string>;
export type CardDirectionClassNameMap = Record<CardDirection, string>;

/** @deprecated Use the specific Card*ClassNameMap type for the map you are defining. */
export type CardProperties = Partial<Record<CardVariant | CardSpacing | CardDirection, string>>;

/** @deprecated Use the specific Card*ClassNameMap type for the map you are defining. */
export type ICardProperties = CardProperties;

const DEFAULT_STYLE = "bg-surface-1 rounded-lg border-[0.5px] border-subtle w-full flex flex-col";
export const containerStyle: CardVariantClassNameMap = {
  "without-shadow": "",
  "with-shadow": "hover:shadow-raised-200 duration-300",
};
export const spacings: CardSpacingClassNameMap = {
  sm: "p-4",
  lg: "p-6",
};
export const directions: CardDirectionClassNameMap = {
  row: "flex-row space-x-3",
  column: "flex-col space-y-3",
};
export const getCardStyle = (variant: CardVariant, spacing: CardSpacing, direction: CardDirection) =>
  DEFAULT_STYLE + " " + directions[direction] + " " + containerStyle[variant] + " " + spacings[spacing];
