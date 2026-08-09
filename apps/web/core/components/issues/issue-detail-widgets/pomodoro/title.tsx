/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CollapsibleButton } from "@plane/ui";
// lucide
import { Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { formatCountdown } from "@/components/pomodoro/helper";

type Props = {
  isOpen: boolean;
};

export const PomodoroCollapsibleTitle = observer(function PomodoroCollapsibleTitle(props: Props) {
  const { isOpen } = props;
  const { t } = useTranslation();
  const { remainingSeconds, isBreak, hasActiveTimer } = usePomodoroTimer();

  const indicatorElement = useMemo(() => {
    if (!hasActiveTimer && !isBreak) {
      return (
        <span className="size-3.5 text-tertiary">
          <Timer />
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        <span className="relative flex size-2 items-center justify-center">
          <span className="absolute size-2 animate-ping rounded-full bg-accent-primary" />
          <span className="relative size-1.5 rounded-full bg-accent-primary" />
        </span>
        <p className="text-14 leading-3 font-medium text-primary">{formatCountdown(remainingSeconds)}</p>
      </span>
    );
  }, [hasActiveTimer, isBreak, remainingSeconds]);

  return <CollapsibleButton isOpen={isOpen} title={t("pomodoro.title")} indicatorElement={indicatorElement} />;
});
