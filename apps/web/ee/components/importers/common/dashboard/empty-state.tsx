"use client";

import { FC } from "react";
import { useTranslation } from "@plane/i18n";

export const EmptyState: FC = () => {
  const { t } = useTranslation();
  return <div>{t("common.no_data_available")}</div>;
};
