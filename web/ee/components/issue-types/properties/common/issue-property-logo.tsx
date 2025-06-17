import React, { FC } from "react";
import { TriangleAlert } from "lucide-react";
// plane imports
import { TLogoProps } from "@plane/types";
import { LUCIDE_ICONS_LIST } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  icon_props: TLogoProps["icon"];
  size?: number;
  colorClassName?: string;
};

export const IssuePropertyLogo: FC<Props> = (props) => {
  const { icon_props, size = 16, colorClassName = "" } = props;
  // derived values
  const LucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === icon_props?.name)?.element ?? TriangleAlert;

  // icon
  return (
    <>
      <LucideIcon
        style={{
          color: !colorClassName ? icon_props?.color : undefined,
          height: size,
          width: size,
        }}
        className={cn(colorClassName)}
      />
    </>
  );
};
