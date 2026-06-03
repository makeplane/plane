/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  isAuthorized: boolean;
};

export const ProfileNavbar = observer(function ProfileNavbar(props: Props) {
  const { isAuthorized } = props;
  const { t } = useTranslation();
  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();
  // store hooks
  const { toggleCreateIssueModal } = useCommandPalette();
  const { joinedProjectIds } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canAddWorkItem =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE) &&
    joinedProjectIds.length > 0;

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  return (
    <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false}>
      <Header.LeftItem>
        <div className="flex items-center overflow-x-scroll">
          {tabsList.map((tab) => {
            const tabLabel = (
              <span
                className={cn(
                  `flex whitespace-nowrap border-b-2 p-4 text-13 font-medium outline-none text-tertiary hover:text-primary ${
                    pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`
                      ? "border-accent-strong text-accent-primary hover:text-accent-primary"
                      : "border-transparent"
                  }`
                )}
              >
                {t(tab.i18n_label)}
              </span>
            );

            return (
              <Link key={tab.route} href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}>
                {tab.i18n_description ? (
                  <Tooltip tooltipContent={t(tab.i18n_description)} position="bottom">
                    {tabLabel}
                  </Tooltip>
                ) : (
                  tabLabel
                )}
              </Link>
            );
          })}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {canAddWorkItem && (
          <Button variant="primary" size="lg" onClick={() => toggleCreateIssueModal(true)}>
            <div className="block sm:hidden">{t("issue.label", { count: 1 })}</div>
            <div className="hidden sm:block">{t("issue.add.label")}</div>
          </Button>
        )}
      </Header.RightItem>
    </Header>
  );
});
