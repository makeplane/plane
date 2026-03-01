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

import type { FC } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
// plane web components
import { PersonalAccessTokenAuth } from "@/components/importers/clickup";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";

export const AuthenticationRoot = observer(function AuthenticationRoot() {
  // hooks
  const {
    auth: { currentAuth },
  } = useClickUpImporter();

  if (currentAuth?.isAuthenticated) return null;

  return (
    <Fragment>
      <PersonalAccessTokenAuth />
    </Fragment>
  );
});
