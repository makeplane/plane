import React, { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import RequestEmptyDark from "@/public/empty-state/customers/request-search-dark.svg";
import RequestEmptyLight from "@/public/empty-state/customers/request-search-light.svg";

export const CustomerRequestSearchEmptyState: FC = observer(() => {
  // i18n
  const { t } = useTranslation();
  // hooks
  const { resolvedTheme } = useTheme();
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md p-2">
        <Image src={resolvedTheme === "dark" ? RequestEmptyDark : RequestEmptyLight} alt="request-empty" />
      </div>
      <span className="text-center text-base font-medium">{t("customers.requests.empty_state.search.title")}</span>
      <span className="text-center text-sm text-custom-text-200">
        {/* TODO: Translate here */}
        Try with another search term or{" "}
        <a href="mailto:support@plane.so" className="underline">
          reach out to us
        </a>{" "}
        if you are sure you should see results for that term.
      </span>
    </div>
  );
});
