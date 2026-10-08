/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { forwardRef, useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
// plane imports
import { DURATION_INPUT_STEP_SECONDS, MANUAL_MIN_SECONDS, TIME_ENTRY_MAX_SECONDS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Input } from "@plane/ui";
import type { TDurationInputResult } from "@plane/utils";
import { analyzeDurationInput, cn, formatTimeDuration } from "@plane/utils";

type Props = {
  value: number | null;
  onChange: (seconds: number | null) => void;
  /** Enter on a valid value */
  onSubmit?: (seconds: number | null) => void;
  /** Escape */
  onCancel?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  /** for timesheet cells: no preview line; errors show as a red border plus tooltip */
  compact?: boolean;
  /** an empty input is valid (e.g. clearing a timesheet cell) */
  allowEmpty?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
};

const toText = (seconds: number | null) => (seconds ? formatTimeDuration(seconds, "short") : "");

export const useDurationErrorMessage = () => {
  const { t } = useTranslation();
  return (result: TDurationInputResult): string | undefined => {
    if (!result.error || result.error === "empty") return undefined;
    if (result.suggestedMinutes) return t("time-tracking.duration.did_you_mean", { minutes: result.suggestedMinutes });
    return t(`time-tracking.duration.${result.error}`);
  };
};

/**
 * A text input for durations: "1h 30m", "1:30", "1.5"… (see parseDurationInput).
 * Shows a live preview, steps by 15 minutes with the arrow keys and normalises the text on blur.
 */
export const DurationInput = forwardRef<HTMLInputElement, Props>(function DurationInput(props, ref) {
  const {
    value,
    onChange,
    onSubmit,
    onCancel,
    onBlur,
    autoFocus,
    compact = false,
    allowEmpty = false,
    disabled,
    id,
    placeholder,
    className,
    hasError,
  } = props;
  const { t } = useTranslation();
  const getErrorMessage = useDurationErrorMessage();
  const [text, setText] = useState(() => toText(value));
  const [touched, setTouched] = useState(false);

  // follow outside changes (e.g. "Save & add another" clearing the form)
  useEffect(() => {
    setText((current) => (analyzeDurationInput(current).seconds === value ? current : toText(value)));
  }, [value]);

  const result = analyzeDurationInput(text);
  const errorMessage = result.error === "empty" && allowEmpty ? undefined : getErrorMessage(result);
  const showError = (touched || text.length > 0) && !!errorMessage;

  const update = (next: string) => {
    setText(next);
    onChange(analyzeDurationInput(next).seconds);
  };

  const step = (direction: 1 | -1) => {
    const current = result.seconds ?? 0;
    const next = Math.min(
      TIME_ENTRY_MAX_SECONDS,
      Math.max(MANUAL_MIN_SECONDS, current + direction * DURATION_INPUT_STEP_SECONDS)
    );
    update(formatTimeDuration(next, "short"));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      step(event.key === "ArrowUp" ? 1 : -1);
    } else if (event.key === "Enter" && onSubmit) {
      event.preventDefault();
      if (result.seconds !== null || (allowEmpty && result.error === "empty")) onSubmit(result.seconds);
      else setTouched(true);
    } else if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  };

  const input = (
    <Input
      ref={ref}
      id={id}
      value={text}
      // oxlint-disable-next-line jsx_a11y/no-autofocus
      autoFocus={autoFocus}
      disabled={disabled}
      inputSize={compact ? "xs" : "sm"}
      placeholder={placeholder ?? t("time-tracking.duration.placeholder")}
      hasError={showError || hasError}
      onChange={(event) => update(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setTouched(true);
        if (result.seconds !== null) setText(formatTimeDuration(result.seconds, "short"));
        onBlur?.();
      }}
      className={cn("w-full", className)}
      aria-invalid={showError}
    />
  );

  if (compact) {
    return (
      <Tooltip tooltipContent={errorMessage} disabled={!showError} position="top">
        {input}
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {input}
      {showError ? (
        <span className="text-11 text-danger-primary">{errorMessage}</span>
      ) : result.seconds !== null ? (
        <span className="text-11 text-tertiary">
          {t("time-tracking.duration.preview", { duration: formatTimeDuration(result.seconds, "short") })}
        </span>
      ) : null}
    </div>
  );
});
