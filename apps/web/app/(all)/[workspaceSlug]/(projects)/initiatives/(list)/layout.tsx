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

// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane-web
import { InitiativesFilterProvider } from "@/components/initiatives/components/rich-filters/context";
// local components
import { InitiativesListHeader } from "./header";

function InitiativesListLayout() {
  return (
    <InitiativesFilterProvider>
      <AppHeader header={<InitiativesListHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </InitiativesFilterProvider>
  );
}

export default InitiativesListLayout;
