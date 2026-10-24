/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentType, SVGProps } from "react";
// plane imports
import {
  CubeOutline,
  DiamondOutline,
  FlagOutline,
  SquareStackOutline,
  StarOutline,
  WorkItemsOutline,
} from "@makeplane/propel/icons";
import { cn, generateIconColors } from "@plane/utils";

export type TIssueTypeLogoIcon = {
  name?: string;
  background_color?: string;
};

export type TIssueTypeLogoSize = "sm" | "md" | "lg" | "xl";

type Props = {
  icon_props?: TIssueTypeLogoIcon | null;
  size?: TIssueTypeLogoSize;
  containerClassName?: string;
};

type TLogoPreset = {
  name: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const ISSUE_TYPE_LOGO_ICONS: TLogoPreset[] = [
  { name: "WorkItems", Icon: WorkItemsOutline },
  { name: "Diamond", Icon: DiamondOutline },
  { name: "SquareStack", Icon: SquareStackOutline },
  { name: "Cube", Icon: CubeOutline },
  { name: "Flag", Icon: FlagOutline },
  { name: "Star", Icon: StarOutline },
];

export const ISSUE_TYPE_LOGO_COLORS = [
  "#4C49F8",
  "#748AFF",
  "#6DBCF5",
  "#1FA191",
  "#FC964D",
  "#EF5974",
  "#5D407A",
  "#999AA0",
];

const sizeClassMap: Record<TIssueTypeLogoSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-7",
  xl: "size-9",
};

const iconSizeMap: Record<TIssueTypeLogoSize, number> = {
  sm: 11,
  md: 13,
  lg: 16,
  xl: 20,
};

export function getIssueTypeLogoIcon(logoProps?: Record<string, unknown> | null): TIssueTypeLogoIcon {
  const icon = logoProps?.icon;
  if (icon && typeof icon === "object") return icon as TIssueTypeLogoIcon;
  return {};
}

export function IssueTypeLogo(props: Props) {
  const { icon_props, size = "md", containerClassName } = props;
  // derived values
  const preset = ISSUE_TYPE_LOGO_ICONS.find((item) => item.name === icon_props?.name) ?? ISSUE_TYPE_LOGO_ICONS[0];
  const { foreground, background } = generateIconColors(icon_props?.background_color ?? ISSUE_TYPE_LOGO_COLORS[0]);
  const Glyph = preset.Icon;
  const glyphSize = iconSizeMap[size];

  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded", sizeClassMap[size], containerClassName)}
      style={{ backgroundColor: background }}
    >
      <Glyph style={{ width: glyphSize, height: glyphSize, color: foreground }} />
    </span>
  );
}
