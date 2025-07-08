"use client";

import { useTranslation } from "@plane/i18n";
import { FC } from "react";

export const EmptyState: FC = () => {
  const { t } = useTranslation();
  return <div>{t("common.no_data_available")}</div>;
};
