/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { BRAND_NAME } from "@plane/constants";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export function PageHead(props: PageHeadTitleProps) {
  const { title } = props;

  useEffect(() => {
    if (title) {
      document.title = title ?? BRAND_NAME;
    }
  }, [title]);

  return null;
}
