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

// layouts
import { Outlet } from "react-router";
import { EInitiativeNavigationItem } from "@plane/types";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { InitiativesDetailsHeader } from "@/components/initiatives/header/root";

function InitiativeScopeLayout() {
  return (
    <>
      <AppHeader header={<InitiativesDetailsHeader selectedNavigationKey={EInitiativeNavigationItem.SCOPE} />} />
      <ContentWrapper className="overflow-hidden">
        <Outlet />
      </ContentWrapper>
    </>
  );
}

export default InitiativeScopeLayout;
