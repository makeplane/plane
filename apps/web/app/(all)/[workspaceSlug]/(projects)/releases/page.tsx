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
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { ReleasesRoot } from "@/components/releases/releases-root";

function ReleasesPage() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace?.name} - ${t("releases.label", { count: 2 })}`
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <ReleasesRoot />
    </>
  );
}

export default observer(ReleasesPage);
