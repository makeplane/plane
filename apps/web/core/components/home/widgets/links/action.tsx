/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { AddOutline } from "@makeplane/propel/icons";

type TProps = {
  onClick: () => void;
};
export function AddLink(props: TProps) {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <button
      className="btn btn-primary flex h-[56px] w-[230px] gap-4 rounded-md border-[0.5px] border-subtle bg-surface-1 px-4"
      onClick={onClick}
    >
      <div className="my-auto h-8 w-8 rounded-sm bg-layer-1/40 p-2">
        <AddOutline className="text-2 h-4 w-4 text-tertiary" />
      </div>
      <div className="my-auto text-13 font-medium">{t("home.quick_links.add")}</div>
    </button>
  );
}
