"use client";
import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { copyUrlToClipboard } from "@plane/utils";

type TCreateCustomerCreateToastActions = {
  workspaceSlug: string;
  customerId: string;
};

export const CreateCustomerCreateToastActions: FC<TCreateCustomerCreateToastActions> = observer((props) => {
  const { workspaceSlug, customerId } = props;
  // state
  const [copied, setCopied] = useState(false);
  // i18n
  const { t } = useTranslation();

  const customerLink = `/${workspaceSlug}/customers/${customerId}`;

  const copyToClipboard = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    try {
      await copyUrlToClipboard(customerLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-1 text-xs text-custom-text-200">
      <a
        href={customerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
      >
        {t("common.view")}
      </a>

      {copied ? (
        <>
          <span className="cursor-default px-2 py-1 text-custom-text-200">{t("common.copied")}</span>
        </>
      ) : (
        <>
          <button
            className="cursor-pointer hidden group-hover:flex px-2 py-1 text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-90 rounded"
            onClick={copyToClipboard}
          >
            {t("common.actions.copy_link")}
          </button>
        </>
      )}
    </div>
  );
});
