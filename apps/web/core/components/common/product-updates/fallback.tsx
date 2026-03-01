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

import { EmptyStateDetailed } from "@plane/propel/empty-state";

type TProductUpdatesFallbackProps = {
  description: string;
  variant: "cloud" | "self-managed";
};

export function ProductUpdatesFallback(props: TProductUpdatesFallbackProps) {
  const { description, variant } = props;
  // derived values
  const changelogUrl =
    variant === "cloud"
      ? "https://plane.so/changelog?category=cloud"
      : "https://plane.so/changelog?category=self-hosted";

  return (
    <div className="py-8">
      <EmptyStateDetailed
        assetKey="changelog"
        description={description}
        align="center"
        actions={[
          {
            label: "Go to changelog",
            variant: "primary",
            onClick: () => window.open(changelogUrl, "_blank"),
          },
        ]}
      />
    </div>
  );
}
