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
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import DetailDark from "@/app/assets/empty-state/customers/detail-dark.svg?url";
import DetailLight from "@/app/assets/empty-state/customers/detail-light.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";

type TProps = {
  workspaceSlug: string;
};

export function CustomerEmptyState(props: TProps) {
  const { workspaceSlug } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const router = useAppRouter();
  const { toggleCreateCustomerModal } = useCommandPalette();
  const { resolvedTheme } = useTheme();

  return (
    <EmptyState
      image={resolvedTheme === "light" ? DetailLight : DetailDark}
      title={t("customers.empty_state.detail.title")}
      description={t("customers.empty_state.detail.description")}
      primaryButton={{
        text: t("customers.empty_state.detail.primary_button"),
        onClick: () => router.push(`/${workspaceSlug}/customers`),
      }}
      secondaryButton={
        <Button variant="secondary" onClick={() => toggleCreateCustomerModal()}>
          {t("customers.empty_state.detail.secondary_button")}
        </Button>
      }
    />
  );
}
