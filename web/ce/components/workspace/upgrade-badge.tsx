import { FC } from "react";
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
};

export const UpgradeBadge: FC<TUpgradeBadge> = (props) => {
  const { className, size = "sm" } = props;

  const { t } = useTranslation();

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
      {t("sidebar.pro")}
    </div>
  );
};
