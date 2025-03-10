import React, { FC } from "react";
import { useTranslation } from "@plane/i18n";
import { Button, CustomerRequestIcon } from "@plane/ui";
type TProps = {
  addRequest: () => void;
};
export const CustomerRequestEmptyState: FC<TProps> = (props) => {
  const { addRequest } = props;
  // i18n
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-md bg-custom-background-90 py-12 border border-custom-border-100">
      <div className="rounded-md bg-custom-background-80 p-2">
        <CustomerRequestIcon className="size-5" />
      </div>
      <span className="text-center text-base font-medium">{t("customers.requests.empty_state.list.title")}</span>
      <span className="text-center text-sm text-custom-text-200">
        {t("customers.requests.empty_state.list.description")}
      </span>
      <Button variant="accent-primary" className="mt-5" onClick={addRequest}>
        {t("customers.requests.empty_state.list.button")}
      </Button>
    </div>
  );
};
