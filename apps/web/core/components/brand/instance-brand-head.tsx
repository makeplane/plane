/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { SITE_TITLE } from "@plane/constants";
import { useBrand } from "@/hooks/use-brand";

export const InstanceBrandHead = observer(function InstanceBrandHead() {
  const { name, faviconUrl } = useBrand();

  useEffect(() => {
    if (name && name !== "Plane") {
      document.title = `${name} | Project management`;
    } else if (!document.title) {
      document.title = SITE_TITLE;
    }

    if (!faviconUrl) return;

    const selectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        (node as HTMLLinkElement).href = faviconUrl;
      });
    });
  }, [faviconUrl, name]);

  return null;
});
