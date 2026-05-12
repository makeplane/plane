/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronLeftIcon, InboxIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
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
            className={cn(
              getButtonStyling("secondary", "base"),
              "flex items-center justify-center gap-2 text-tertiary rounded-lg h-6 w-6 p-1 hover:bg-surface-2 hover:text-secondary"
            )}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("notification.label")}
                  icon={<InboxIcon className="h-4 w-4 text-primary" />}
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
