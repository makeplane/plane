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

import { EmptyStateCompact } from "@plane/propel/empty-state";

type TProps = {
  handleNewUpdate: () => void;
};

export function EmptyUpdates(props: TProps) {
  const { handleNewUpdate } = props;

  return (
    <EmptyStateCompact
      assetKey="update"
      title="No updates yet"
      description="You can see the updates here."
      actions={[
        {
          label: "Add an Update",
          onClick: () => handleNewUpdate(),
          variant: "primary",
        },
      ]}
      rootClassName="p-10"
    />
  );
}
