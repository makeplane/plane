/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { HelpCenterHome } from "@/plane-web/components/help-center";

const HelpCenterPage = observer(function HelpCenterPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t("help_center.title")} />
      <HelpCenterHome />
    </>
  );
});

export default HelpCenterPage;
