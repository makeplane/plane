"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { AsanaCustomField } from "@plane/etl/asana";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";

type TConfigureAsanaSelectPriority = {
  value: string | undefined;
  isLoading: boolean;
  asanaPriorities: AsanaCustomField[];
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectPriority: FC<TConfigureAsanaSelectPriority> = observer((props) => {
  // props
  const { value, isLoading, asanaPriorities, handleFormData } = props;
  const { t } = useTranslation();

  return isLoading ? (
    <Loader>
      <Loader.Item height="28px" width="100%" />
    </Loader>
  ) : (
    <Dropdown
      dropdownOptions={(asanaPriorities || [])?.map((priority) => ({
        key: priority.gid,
        label: priority.name,
        value: priority.gid,
        data: priority,
      }))}
      value={value}
      placeHolder={t("importers.select_priority")}
      onChange={(value: string | undefined) => handleFormData(value)}
      queryExtractor={(option) => option.name}
      disabled={false}
    />
  );
});
