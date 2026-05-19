/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { HoExportsList } from "@/plane-web/components/ho/ho-exports-list";

const HoExportsPage = observer(function HoExportsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHead title={t("ho_exports.title")} />
      <HoExportsList />
    </>
  );
});

export default HoExportsPage;
