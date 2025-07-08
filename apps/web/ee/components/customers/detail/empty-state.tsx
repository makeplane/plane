"use client";
import { FC } from "react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
// hooks
import { useCommandPalette } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// assets
import DetailDark from "@/public/empty-state/customers/detail-dark.svg";
import DetailLight from "@/public/empty-state/customers/detail-light.svg";

type TProps = {
  workspaceSlug: string;
};

export const CustomerEmptyState: FC<TProps> = (props) => {
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
        <Button variant="neutral-primary" onClick={() => toggleCreateCustomerModal()}>
          {t("customers.empty_state.detail.secondary_button")}
        </Button>
      }
    />
  );
};
