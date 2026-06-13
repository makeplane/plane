/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
      ? "https://gizmo.so/changelog?category=cloud"
      : "https://gizmo.so/changelog?category=self-hosted";

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
