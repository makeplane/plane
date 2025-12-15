import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { getAnalyticsTabs } from "./tabs";

export const useAnalyticsTabs = (workspaceSlug: string) => {
  const { t } = useTranslation();

  const analyticsTabs = useMemo(() => getAnalyticsTabs(t), [t]);

  return analyticsTabs;
};
