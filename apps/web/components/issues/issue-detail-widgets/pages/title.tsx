/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PagesOutline } from "@makeplane/propel/icons";

type Props = {
  count: number;
};

export const IssuePagesCollapsibleTitle = observer(function IssuePagesCollapsibleTitle(props: Props) {
  const { count } = props;
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-2">
      <PagesOutline className="h-3.5 w-3.5 text-tertiary" />
      {t("issue.pages.linked_pages")}
      <span className="flex items-center justify-center">
        <p className="text-14 leading-3! text-tertiary">{count}</p>
      </span>
    </span>
  );
});
