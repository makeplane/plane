/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";

type Props = {
  totalMinutes: number | undefined;
  isLoading: boolean;
};

export const TotalTrackedHours = ({ totalMinutes, isLoading }: Props) => {
  const { t } = useTranslation();
  const hours = totalMinutes ? Math.floor(totalMinutes / 60) : 0;
  const minutes = totalMinutes ? totalMinutes % 60 : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-13 text-tertiary">{t("time_tracking_total_hours")}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          <div className="text-20 font-bold text-primary">{totalMinutes ? `${hours}h ${minutes}m` : "0h"}</div>
        </div>
      ) : (
        <Loader.Item height="50px" width="100%" />
      )}
    </div>
  );
};
