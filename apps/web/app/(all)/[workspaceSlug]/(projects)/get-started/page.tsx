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
// components
import { useTranslation } from "@plane/i18n";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { GetStartedRoot } from "@/components/get-started/root";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local components
import { GetStartedHeader } from "./header";

function GetStartedPage() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - ${t("common.get_started")}` : undefined;

  return (
    <>
      <AppHeader header={<GetStartedHeader />} />
      <ContentWrapper>
        <PageHead title={pageTitle} />
        <GetStartedRoot />
      </ContentWrapper>
    </>
  );
}

export default observer(GetStartedPage);
