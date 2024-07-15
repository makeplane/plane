import { FC } from "react";
// helpers
import { cn } from "@/helpers/common.helper";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
};

export const UpgradeBadge: FC<TUpgradeBadge> = (props) => {
  const { className, size = "sm" } = props;

  return (
    <div
      className={cn(
        "w-fit cursor-pointer rounded-2xl text-custom-primary-200 bg-custom-primary-100/20 text-center font-medium outline-none",
        {
          "text-sm px-3": size === "md",
          "text-xs px-2": size === "sm",
        },
        className
      )}
    >
      Pro
    </div>
  );
};
