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

import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

type TProps = {
  handleNewUpdate: () => void;
  allowNew: boolean;
};

export function EmptyUpdates(props: TProps) {
  const { handleNewUpdate, allowNew } = props;
  const { t } = useTranslation();

  return (
    <EmptyStateCompact
      assetKey="update"
      title={t("updates.empty.title")}
      description={t("updates.empty.description")}
      actions={[
        {
          label: t("updates.add_update"),
          onClick: () => handleNewUpdate(),
          variant: "primary",
          disabled: !allowNew,
        },
      ]}
      rootClassName="p-10"
    />
  );
}
