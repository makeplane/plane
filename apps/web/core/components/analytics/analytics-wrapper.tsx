import React from "react";
// plane package imports
import { useTranslation   } from "@plane/i18n";
import type {KeysWithoutParams, PrefixedKeyWithoutParams} from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  i18nTitle: KeysWithoutParams<"translation"> | PrefixedKeyWithoutParams;
  children: React.ReactNode;
  className?: string;
};

function AnalyticsWrapper(props: Props) {
  const { i18nTitle, children, className } = props;
  const { t } = useTranslation();
  return (
    <div className={cn("px-6 py-4", className)}>
      <h1 className={"mb-4 text-20 font-bold md:mb-6"}>{t(i18nTitle)}</h1>
      {children}
    </div>
  );
}

export default AnalyticsWrapper;
