/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// ui
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useSelfHostedPolicy } from "@/hooks/store/use-self-hosted-policy";
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";
// local components
import { Button } from "@plane/propel/button";
import { PaidPlanUpgradeModal } from "@/components/license/modal/upgrade-modal";

export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // states
  const [isPaidPlanPurchaseModalOpen, setIsPaidPlanPurchaseModalOpen] = useState(false);
  // translation
  const { t } = useTranslation();
  // platform
  const { isMobile } = usePlatformOS();
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { isSelfHosted } = useSelfHostedPolicy();

  // The self-hosted Community edition has no purchasable plan tier: the badge
  // points at the billing settings page (Community policy) instead of opening
  // the cloud upgrade modal, which implies missing paid-only features.
  if (isSelfHosted) {
    return (
      <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
        <Link href={`/${workspaceSlug}/settings/billing`}>
          <Button variant="tertiary" size="lg" aria-label={t("aria_labels.projects_sidebar.edition_badge")}>
            Community
          </Button>
        </Link>
      </Tooltip>
    );
  }

  return (
    <>
      <PaidPlanUpgradeModal
        isOpen={isPaidPlanPurchaseModalOpen}
        handleClose={() => setIsPaidPlanPurchaseModalOpen(false)}
      />
      <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
        <Button
          variant="tertiary"
          size="lg"
          onClick={() => setIsPaidPlanPurchaseModalOpen(true)}
          aria-haspopup="dialog"
          aria-label={t("aria_labels.projects_sidebar.edition_badge")}
        >
          Community
        </Button>
      </Tooltip>
    </>
  );
});
