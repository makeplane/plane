"use client";

import { FC } from "react";
// helpers
import { cn } from "helpers/common.helper";

type Props = {
  name: string;
  description: string;
  icon: JSX.Element;
  config: JSX.Element;
  disabled?: boolean;
  withBorder?: boolean;
  unavailable?: boolean;
};

export const AuthenticationMethodCard: FC<Props> = (props) => {
  const { name, description, icon, config, disabled = false, withBorder = true, unavailable = false } = props;

  return (
    <div
      className={cn("w-full flex items-center gap-14 rounded", {
        "px-4 py-3 border border-custom-border-200": withBorder,
      })}
    >
      <div
        className={cn("flex grow items-center gap-4", {
          "opacity-50": unavailable,
        })}
      >
        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-custom-background-80">{icon}</div>
        </div>
        <div className="grow">
          <div
            className={cn("font-medium leading-5 text-custom-text-100", {
              "text-sm": withBorder,
              "text-xl": !withBorder,
            })}
          >
            {name}
          </div>
          <div
            className={cn("font-normal leading-5 text-custom-text-300", {
              "text-xs": withBorder,
              "text-sm": !withBorder,
            })}
          >
            {description}
          </div>
        </div>
      </div>
      <div className={`shrink-0 ${disabled && "opacity-70"}`}>{config}</div>
    </div>
  );
};
