import React from "react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  i18nTitle: string;
  children: React.ReactNode;
  className?: string;
};

const AnalyticsWrapper: React.FC<Props> = (props) => {
  const { i18nTitle, children, className } = props;
  const { t } = useTranslation();
  return (
    <div className={cn("px-6 py-4", className)}>
      <h1 className={"mb-4 text-2xl font-bold md:mb-6"}>{t(i18nTitle)}</h1>
      {children}
    </div>
  );
};

export default AnalyticsWrapper;
