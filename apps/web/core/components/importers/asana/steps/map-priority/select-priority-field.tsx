/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
import type { AsanaCustomField } from "@plane/etl/asana";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/components/importers/ui";

type TConfigureAsanaSelectPriority = {
  value: string | undefined;
  isLoading: boolean;
  asanaPriorities: AsanaCustomField[];
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectPriority = observer(function ConfigureAsanaSelectPriority(
  props: TConfigureAsanaSelectPriority
) {
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
