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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ReleaseIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useReleasePermissions } from "@/hooks/permissions/use-release-permissions";

type Props = {
  workspaceSlug: string;
};

export const WorkspaceReleaseHeader = observer(function WorkspaceReleaseHeader(props: Props) {
  const { workspaceSlug } = props;
  const router = useAppRouter();
  const releasePermissions = useReleasePermissions(workspaceSlug);
  const { toggleCreateReleaseModal } = useCommandPalette();
  const { t } = useTranslation();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs onBack={() => router.back()}>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label="Releases" icon={<ReleaseIcon className="h-4 w-4" />} />}
            />
          </Breadcrumbs>
        </Header.LeftItem>
        {releasePermissions.canCreate && (
          <Header.RightItem>
            <Button
              variant="primary"
              size="lg"
              onClick={() => toggleCreateReleaseModal({ isOpen: true, releaseId: undefined })}
            >
              <div className="hidden sm:block">{t("add")}</div> Releases
            </Button>
          </Header.RightItem>
        )}
      </Header>
    </>
  );
});
