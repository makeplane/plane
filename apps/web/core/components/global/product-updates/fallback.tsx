/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EmptyStateDetailed } from "@plane/propel/empty-state";

type TProductUpdatesFallbackProps = {
  description: string;
  changelogUrl?: string;
};

export function ProductUpdatesFallback(props: TProductUpdatesFallbackProps) {
  const { description, changelogUrl } = props;

  return (
    <div className="py-8">
      <EmptyStateDetailed
        assetKey="changelog"
        description={description}
        align="center"
        actions={
          changelogUrl
            ? [
                {
                  label: "Go to changelog",
                  variant: "primary",
                  onClick: () => window.open(changelogUrl, "_blank"),
                },
              ]
            : []
        }
      />
    </div>
  );
}
