/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";

export function TesthubUnbound({ href }: { href: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-14 text-secondary">{t("testhub.bind.unbound")}</p>
      <Link to={href}>
        <Button variant="primary" size="sm">
          {t("testhub.bind.cta")}
        </Button>
      </Link>
    </div>
  );
}
