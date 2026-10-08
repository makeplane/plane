/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";

export const TimeTrackingHeader = observer(function TimeTrackingHeader() {
  const { t } = useTranslation();
  const { canView } = useTimeTrackingPermissions();
  const { openLogTimeModal } = useTimer();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink label={t("time-tracking.title")} icon={<Timer className="h-4 w-4 text-tertiary" />} />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canView && (
        <Header.RightItem>
          <Button variant="primary" size="lg" onClick={() => openLogTimeModal()}>
            {t("time-tracking.log_time_button")}
          </Button>
        </Header.RightItem>
      )}
    </Header>
  );
});
