"use client";

import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// public images
import EstimateEmptyDarkImage from "@/public/empty-state/estimates/dark.svg";
import EstimateEmptyLightImage from "@/public/empty-state/estimates/light.svg";

type TEstimateEmptyScreen = {
  onButtonClick: () => void;
};

export const EstimateEmptyScreen: FC<TEstimateEmptyScreen> = (props) => {
  // props
  const { onButtonClick } = props;
  const { resolvedTheme } = useTheme();

  const { t } = useTranslation();

  const emptyScreenImage = resolvedTheme === "light" ? EstimateEmptyLightImage : EstimateEmptyDarkImage;

  return (
    <div className="relative flex flex-col justify-center items-center text-center gap-8 border border-custom-border-300 rounded bg-custom-background-90 py-10">
      <div className="flex-shrink-0 w-[120px] h-[120px] overflow-hidden relative flex justify-center items-center">
        <Image
          src={emptyScreenImage}
          alt="Empty estimate image"
          width={100}
          height={100}
          className="object-contain w-full h-full"
        />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xl font-semibold text-custom-text-100">
          {t("project_settings.empty_state.estimates.title")}
        </h3>
        <p className="text-sm text-custom-text-300">{t("project_settings.empty_state.estimates.description")}</p>
      </div>
      <div>
        <Button onClick={onButtonClick}>{t("project_settings.empty_state.estimates.primary_button")}</Button>
      </div>
    </div>
  );
};
