/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { AnchorButton } from "@makeplane/propel/components/anchor-button";
import { Banner } from "@makeplane/propel/components/banner";
import { MARKETING_PLANE_ONE_PAGE_LINK } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  selectionHelpers: TSelectionHelper;
};

export const IssueBulkOperationsRoot = observer(function IssueBulkOperationsRoot(props: Props) {
  const { className, selectionHelpers } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const { isSelectionActive } = useMultipleSelectStore();

  if (!isSelectionActive || selectionHelpers.isSelectionDisabled) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] grid h-20 place-items-center px-3.5", className)}>
      <Banner
        placement="inline"
        variant="accent"
        icon={null}
        title={t("bulk_operations.upgrade_banner.message")}
        actions={
          <AnchorButton
            variant="primary"
            size="sm"
            label={t("bulk_operations.upgrade_banner.cta")}
            nativeButton={false}
            render={
              <a
                href={MARKETING_PLANE_ONE_PAGE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("bulk_operations.upgrade_banner.cta")}
              />
            }
          />
        }
        render={<div className="w-full" />}
      />
    </div>
  );
});
