/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  i18nTitle: string;
  children: React.ReactNode;
  className?: string;
};

function AnalyticsWrapper(props: Props) {
  const { i18nTitle, children, className } = props;
  const { t } = useTranslation();
  return (
    <div className={cn("px-page-x pt-8 pb-4", className)}>
      <h1 className={"mb-4 text-h4-bold md:mb-6"}>{t(i18nTitle)}</h1>
      {children}
    </div>
  );
}

export default AnalyticsWrapper;
