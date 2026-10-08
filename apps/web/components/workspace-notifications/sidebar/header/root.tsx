/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import Link from "next/link";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronLeftOutline, InboxOutline } from "@makeplane/propel/icons";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// local imports
import { NotificationSidebarHeaderOptions } from "./options";

type TNotificationSidebarHeader = {
  workspaceSlug: string;
};

export const NotificationSidebarHeader = observer(function NotificationSidebarHeader(
  props: TNotificationSidebarHeader
) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();

  if (!workspaceSlug) return <></>;
  return (
    <Header className="my-auto bg-surface-1">
      <Header.LeftItem>
        <div className="flex items-center gap-2">
          <Link
            href={`/${workspaceSlug}`}
            aria-label={t("back_to_workspace")}
            className="flex h-6 w-6 items-center justify-center rounded-lg p-1 text-tertiary hover:bg-surface-2 hover:text-secondary"
          >
            <ChevronLeftOutline className="h-4 w-4" />
          </Link>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("notification.label")}
                  icon={<InboxOutline className="h-4 w-4 text-primary" />}
                  disableTooltip
                />
              }
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <NotificationSidebarHeaderOptions workspaceSlug={workspaceSlug} />
      </Header.RightItem>
    </Header>
  );
});
