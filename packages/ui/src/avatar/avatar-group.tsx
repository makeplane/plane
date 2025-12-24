import React from "react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "../utils";
// types
import type { TAvatarSize } from "./helper";
import { getSizeInfo, isAValidNumber } from "./helper";

type Props = {
  /**
   * The children of the avatar group.
   * These should ideally should be `Avatar` components
   */
  children: React.ReactNode;
  /**
   * The maximum number of avatars to display.
   * If the number of children exceeds this value, the additional avatars will be replaced by a count of the remaining avatars.
   * @default 2
   */
  max?: number;
  /**
   * Whether to show the tooltip or not
   * @default true
   */
  showTooltip?: boolean;
  /**
   * The size of the avatars
   * Possible values: "sm", "md", "base", "lg"
   * @default "md"
   */
  size?: TAvatarSize;
};

export function AvatarGroup(props: Props) {
  const { children, max = 2, showTooltip = true, size = "md" } = props;

  // calculate total length of avatars inside the group
  const totalAvatars = React.Children.toArray(children).length;

  // if avatars are equal to max + 1, then we need to show the last avatar as well, if avatars are more than max + 1, then we need to show the count of the remaining avatars
  const maxAvatarsToRender = totalAvatars <= max + 1 ? max + 1 : max;

  // slice the children to the maximum number of avatars
  const avatars = React.Children.toArray(children).slice(0, maxAvatarsToRender);

  // assign the necessary props from the AvatarGroup component to the Avatar components
  const avatarsWithUpdatedProps = avatars.map((avatar) => {
    const updatedProps: Partial<Props> = {
      showTooltip,
      size,
    };

    return React.cloneElement(avatar as React.ReactElement, updatedProps);
  });

  // get size details based on the size prop
  const sizeInfo = getSizeInfo(size);

  return (
    <div className={cn("flex", sizeInfo.spacing)}>
      {avatarsWithUpdatedProps.map((avatar, index) => (
        <div key={index} className="rounded-full border border-subtle-1">
          {avatar}
        </div>
      ))}
      {maxAvatarsToRender < totalAvatars && (
        <Tooltip tooltipContent={`${totalAvatars} total`} disabled={!showTooltip}>
          <div
            className={cn(
              "grid place-items-center rounded-full bg-accent-subtle text-9 text-accent-primary border border-subtle-1",
              {
                [sizeInfo.avatarSize]: !isAValidNumber(size),
              }
            )}
            style={
              isAValidNumber(size)
                ? {
                    width: `${size}px`,
                    height: `${size}px`,
                  }
                : {}
            }
          >
            +{totalAvatars - max}
          </div>
        </Tooltip>
      )}
    </div>
  );
}
