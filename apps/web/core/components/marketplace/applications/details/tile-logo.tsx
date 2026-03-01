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

import type { TUserApplication } from "@plane/types";
import { getFileURL } from "@plane/utils";
import drawioLogo from "@/app/assets/services/drawio.png?url";

type AppTileLogoProps = {
  app: TUserApplication;
};

export function AppTileLogo(props: AppTileLogoProps) {
  const { app } = props;
  const logoUrl = getLogoUrl(app);
  return logoUrl ? (
    <img src={logoUrl} alt={app.name} className="size-6 rounded-md" />
  ) : (
    <div className="text-body-sm-medium">{app.name?.charAt(0)}</div>
  );
}

/**
 * Get the logo url for the app
 * If the app has a logo url, return the file url
 * If the app is a service app, return the service logo url
 * If the app is not a service app, return undefined
 * @param app
 * @returns
 */
const getLogoUrl = (app: TUserApplication): string | undefined => {
  if (app.logo_url) {
    if (app.is_hardcoded) {
      return app.logo_url;
    }
    return getFileURL(app.logo_url);
  }

  // TODO: Remove this once we have normalized logos for internal apps
  const serviceLogoMap: Record<string, string> = {
    drawio: drawioLogo,
  };
  if (serviceLogoMap[app.slug]) {
    return serviceLogoMap[app.slug];
  }
  return undefined;
};
