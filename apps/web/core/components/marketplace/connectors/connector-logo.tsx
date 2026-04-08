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

import { cn, getFileURL } from "@plane/utils";
import drawioLogo from "@/app/assets/services/drawio.png?url";

type ConnectorLogoProps = {
  connector: {
    name: string;
    logo_url?: string | undefined;
    is_hardcoded?: boolean;
    slug: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function ConnectorLogo(props: ConnectorLogoProps) {
  const { connector, size = "sm", className } = props;
  const logoUrl = getLogoUrl(connector);
  return logoUrl ? (
    <img
      src={logoUrl}
      alt={connector.name}
      className={cn(
        "rounded-md max-w-fit",
        {
          "size-4": size === "sm",
          "size-8": size === "md",
          "size-10": size === "lg",
        },
        className
      )}
    />
  ) : (
    <div
      className={cn("shrink-0 bg-accent-primary text-on-color rounded-lg grid place-items-center", className, {
        "size-4": size === "sm",
        "size-8": size === "md",
        "size-10": size === "lg",
      })}
    >
      <div
        className={cn("text-body-sm-medium", {
          "text-caption-md-medium": size === "sm",
          "text-body-sm-medium": size === "md",
          "text-body-md-medium": size === "lg",
        })}
      >
        {connector.name?.charAt(0)}
      </div>
    </div>
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
const getLogoUrl = (connector: {
  name: string;
  logo_url?: string | undefined;
  is_hardcoded?: boolean;
  slug: string;
}): string | undefined => {
  if (connector.logo_url) {
    if (connector.is_hardcoded) {
      return connector.logo_url;
    }
    return getFileURL(connector.logo_url);
  }

  // TODO: Remove this once we have normalized logos for internal apps
  const serviceLogoMap: Record<string, string> = {
    drawio: drawioLogo,
  };
  if (serviceLogoMap[connector.slug]) {
    return serviceLogoMap[connector.slug];
  }
  return undefined;
};
