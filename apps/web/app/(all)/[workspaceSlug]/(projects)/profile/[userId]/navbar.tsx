/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/blocks/layout";
import { Tabs, TabsList, Tab } from "@makeplane/propel/components/tabs";

type Props = {
  isAuthorized: boolean;
};

export function ProfileNavbar(props: Props) {
  const { isAuthorized } = props;
  const { t } = useTranslation();
  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;
  const activeTab = tabsList.find((tab) => pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`)?.key;

  return (
    <Header variant={EHeaderVariant.SECONDARY} showOnMobile={false} setHeight={false} className="h-12 shrink-0">
      <div className="flex h-full min-w-0 flex-1 items-end">
        <Tabs variant="underline" value={activeTab ?? null}>
          <TabsList aria-label={t("profile.page_label")}>
            {tabsList.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                label={t(tab.i18n_label)}
                nativeButton={false}
                render={
                  <Link
                    href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}
                    aria-current={activeTab === tab.key ? "page" : undefined}
                  />
                }
              />
            ))}
          </TabsList>
        </Tabs>
      </div>
    </Header>
  );
}
