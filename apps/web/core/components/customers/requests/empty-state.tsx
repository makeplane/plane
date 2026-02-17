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

// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomerRequestIcon } from "@plane/propel/icons";
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";

type TProps = {
  addRequest: () => void;
  disabled?: boolean;
};

export function CustomerRequestEmptyState(props: TProps) {
  const { addRequest, disabled = false } = props;
  // i18n
  const { t } = useTranslation();
  return (
    <SectionEmptyState
      heading={t("customers.requests.empty_state.list.title")}
      subHeading={t("customers.requests.empty_state.list.description")}
      icon={<CustomerRequestIcon className="size-5" />}
      actionElement={
        <Button variant="secondary" size="base" onClick={addRequest} disabled={disabled}>
          {t("customers.requests.empty_state.list.button")}
        </Button>
      }
    />
  );
}
