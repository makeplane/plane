/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";

type TProductUpdatesFallbackProps = {
  description: string;
  variant: "cloud" | "self-managed";
};

export function ProductUpdatesFallback(props: TProductUpdatesFallbackProps) {
  const { t } = useTranslation();

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
            label: t("web_ui.go_to_changelog"),
            variant: "primary",
            onClick: () => window.open(changelogUrl, "_blank"),
          },
        ]}
      />
    </div>
  );
}
