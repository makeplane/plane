/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { Popover } from "@plane/propel/popover";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// lucide
import { Check, Pause, Play, Square, Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { PomodoroCountdown } from "./pomodoro-countdown";
import { formatCountdown } from "./helper";

type Props = {
  issueId: string;
};

export const PomodoroHeaderButton = observer(function PomodoroHeaderButton({ issueId }: Props) {
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();

  const {
    activeTimer,
    isTimerRunning,
    isTimerPaused,
    hasActiveTimer,
    loader,
    remainingSeconds,
    startFocus,
    pause,
    resume,
    complete,
    discard,
  } = usePomodoroTimer();

  const isThisIssue = activeTimer?.issue === issueId;
  const isActiveOnThisIssue = hasActiveTimer && isThisIssue;
  const isActiveOnAnotherIssue = hasActiveTimer && !isThisIssue;

  const goToActiveIssue = () => {
    if (!activeTimer || !workspaceSlug) return;
    navigate(`/${workspaceSlug}/projects/${activeTimer.project}/issues/${activeTimer.issue}/`);
  };

  // Idle: just start immediately
  if (!hasActiveTimer) {
    return (
      <Tooltip tooltipContent={t("pomodoro.start_focus")} isMobile={isMobile}>
        <IconButton
          variant="secondary"
          size="lg"
          icon={Timer}
          onClick={() => void startFocus(issueId)}
          disabled={loader === "start"}
        />
      </Tooltip>
    );
  }

  // Running on a different issue: badge dot + popover info
  if (isActiveOnAnotherIssue) {
    return (
      <Popover>
        <Popover.Button>
          <div className="relative inline-flex">
            <IconButton variant="secondary" size="lg" icon={Timer} />
            {/* orange dot badge */}
            <span className="bg-orange-500 ring-surface-1 absolute -top-0.5 -right-0.5 size-2 rounded-full ring-1" />
          </div>
        </Popover.Button>
        <Popover.Panel className="shadow-lg z-20 w-64 rounded-md border border-subtle bg-surface-1 p-3">
          <p className="text-xs mb-2 text-secondary">
            {t("pomodoro.running_on", {
              issue: activeTimer?.issue_detail?.name ?? t("pomodoro.another_work_item"),
            })}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary tabular-nums">{formatCountdown(remainingSeconds)}</span>
            <Button variant="link" size="sm" onClick={goToActiveIssue}>
              {t("pomodoro.open_work_item")} →
            </Button>
          </div>
        </Popover.Panel>
      </Popover>
    );
  }

  // Running or paused on this issue: live countdown button + controls popover
  if (isActiveOnThisIssue) {
    return (
      <Popover>
        <Popover.Button>
          <Tooltip tooltipContent={t("pomodoro.title")} isMobile={isMobile}>
            <button
              type="button"
              className={cn(
                "text-xs flex h-7 items-center gap-1.5 rounded border px-2 font-medium transition-colors",
                "border-subtle bg-surface-2 text-primary hover:bg-layer-transparent-hover",
                isTimerRunning && "border-accent-primary/30 bg-accent-subtle text-accent-primary"
              )}
            >
              <Timer className="size-3.5 shrink-0" />
              <PomodoroCountdown seconds={remainingSeconds} size="sm" />
            </button>
          </Tooltip>
        </Popover.Button>
        <Popover.Panel className="shadow-lg z-20 w-44 rounded-md border border-subtle bg-surface-1 p-2">
          <div className="flex flex-col gap-1">
            {isTimerRunning ? (
              <>
                <PopoverActionButton
                  icon={<Pause className="size-3.5" />}
                  label={t("pomodoro.pause")}
                  onClick={() => void pause()}
                  disabled={loader === "mutate"}
                />
                <PopoverActionButton
                  icon={<Check className="size-3.5" />}
                  label={t("pomodoro.complete")}
                  onClick={() => void complete()}
                  disabled={loader === "mutate"}
                />
                <PopoverActionButton
                  icon={<Square className="size-3.5" />}
                  label={t("pomodoro.discard")}
                  onClick={() => void discard()}
                  disabled={loader === "mutate"}
                  danger
                />
              </>
            ) : isTimerPaused ? (
              <>
                <PopoverActionButton
                  icon={<Play className="size-3.5" />}
                  label={t("pomodoro.resume")}
                  onClick={() => void resume()}
                  disabled={loader === "mutate"}
                />
                <PopoverActionButton
                  icon={<Check className="size-3.5" />}
                  label={t("pomodoro.complete")}
                  onClick={() => void complete()}
                  disabled={loader === "mutate"}
                />
                <PopoverActionButton
                  icon={<Square className="size-3.5" />}
                  label={t("pomodoro.discard")}
                  onClick={() => void discard()}
                  disabled={loader === "mutate"}
                  danger
                />
              </>
            ) : null}
          </div>
        </Popover.Panel>
      </Popover>
    );
  }

  return null;
});

const PopoverActionButton = ({
  icon,
  label,
  onClick,
  disabled,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "text-xs flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-50",
      danger ? "text-red-500 hover:bg-red-500/10" : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
    )}
  >
    {icon}
    {label}
  </button>
);
