/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useNavigate } from "react-router";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";

type Props = {
  href: string;
  title?: string;
  description?: string;
  cta?: string;
};

export function TesthubUnbound({ href, title, description, cta }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="h-full w-full">
      <EmptyStateDetailed
        assetKey="project"
        title={title ?? t("testhub.bind.unbound")}
        description={description ?? t("testhub.bind.unbound_description")}
        actions={[
          {
            label: cta ?? t("testhub.bind.cta"),
            variant: "primary",
            onClick: () => navigate(href),
          },
        ]}
      />
    </div>
  );
}
