import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader, Monitor, TriangleAlert, X } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, copyTextToClipboard } from "@plane/utils";

import type {
  TLooperConnection,
  TLooperConnectionCheckKey,
  TLooperConnectionCheckStatus,
  TLooperConnectionStatus,
} from "./types";
import { useLooperConnection } from "./use-looper-connection";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  onConnected: () => void;
};

/** Read in the order a person would ask the questions: is it me, is Looper there, is it safe, is it usable. */
const CHECK_ORDER: TLooperConnectionCheckKey[] = [
  "identity_verified",
  "cli_connected",
  "key_verified",
  "node_online",
  "strict_dispatch",
  "inbox_verified",
];

const STEP_COUNT = 3;

const STEP_BY_STATUS: Partial<Record<TLooperConnectionStatus, 1 | 2 | 3>> = {
  created: 1,
  cli_connected: 2,
  binding_created: 2,
  completed: 3,
};

const STEP_NAMES = { 1: "command", 2: "verify", 3: "done" } as const;

/**
 * A false check is only a failure once the session can no longer recover; while the session is
 * live it just means "not answered yet", and calling that a failure would alarm people wrongly.
 */
const checkStatus = (passed: boolean | undefined, isSettled: boolean): TLooperConnectionCheckStatus => {
  if (passed) return "passed";
  return isSettled ? "failed" : "pending";
};

export function ConnectLooperModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, projectId, onConnected } = props;
  const { t } = useTranslation();
  const {
    connection,
    createErrorCode,
    createErrorDetail,
    isCreating,
    isCancelling,
    isConnectionStale,
    create,
    cancel,
    markExpired,
    reset,
  } = useLooperConnection(workspaceSlug, projectId);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const status = connection?.status;
  const isDeviceExists = status === "device_exists";
  const isCountingDown = status === "created" || status === "cli_connected" || status === "binding_created";

  // Open the wizard straight into a live session so the first screen already carries the command.
  useEffect(() => {
    if (isOpen && !connection && !isCreating && !createErrorCode) void create();
  }, [isOpen, connection, isCreating, createErrorCode, create]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setHasCopied(false);
      setRemainingMs(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!connection?.expires_at || !isCountingDown) {
      setRemainingMs(null);
      return;
    }
    const deadline = new Date(connection.expires_at).getTime();
    const tick = () => {
      const left = deadline - Date.now();
      setRemainingMs(Math.max(left, 0));
      if (left <= 0) markExpired();
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [connection?.expires_at, isCountingDown, markExpired]);

  const handleClose = useCallback(async () => {
    await cancel();
    onClose();
  }, [cancel, onClose]);

  const handleCopy = useCallback(async () => {
    if (!connection?.command) return;
    try {
      await copyTextToClipboard(connection.command);
      setHasCopied(true);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("toast.success"), message: t("issue.looper.connect.copied") });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("issue.looper.connect.copy_failed"),
      });
    }
  }, [connection?.command, t]);

  const handleRetry = useCallback(async () => {
    reset();
    setHasCopied(false);
    await create();
  }, [reset, create]);

  const countdownLabel = useMemo(() => {
    if (remainingMs === null) return null;
    const totalSeconds = Math.ceil(remainingMs / 1000);
    if (totalSeconds < 60) return t("issue.looper.connect.command.expires_soon");
    return t("issue.looper.connect.command.expires_in", {
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60,
    });
  }, [remainingMs, t]);

  const errorCode = createErrorCode ?? connection?.error_code ?? null;
  const errorDetail = createErrorDetail ?? connection?.error_detail ?? null;
  const step = (status && STEP_BY_STATUS[status]) ?? 1;

  const renderDevice = (connected: TLooperConnection) =>
    connected.node ? (
      <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2.5">
        <Monitor className="size-4 shrink-0 text-tertiary" aria-hidden="true" />
        <span className="min-w-0 truncate text-body-xs-medium text-primary">
          {t("issue.looper.connect.device", {
            node: connected.node.name,
            owner: connected.owner?.display_name ?? t("issue.looper.unknown_owner"),
          })}
        </span>
      </div>
    ) : null;

  const renderChecks = (connected: TLooperConnection, isSettled: boolean) => (
    <ul className="divide-y divide-subtle overflow-hidden rounded-md border border-subtle" aria-live="polite">
      {CHECK_ORDER.map((key) => {
        const state = checkStatus(connected.checks?.[key], isSettled);
        return (
          <li key={key} className="flex min-h-9 items-center gap-2 px-3 py-2">
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border border-subtle-1",
                state === "passed" && "border-success-primary bg-success-primary text-on-color",
                state === "failed" && "border-danger-primary bg-danger-primary text-on-color"
              )}
              aria-hidden="true"
            >
              {state === "passed" && <Check className="size-2.5" strokeWidth={3} />}
              {state === "failed" && <X className="size-2.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 grow text-body-xs-regular text-primary">
              {t(`issue.looper.connect.check.${key}`)}
            </span>
            <span className="shrink-0 text-caption-sm-regular text-tertiary">
              {t(`issue.looper.connect.check_status.${state}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const renderLoading = () => (
    <div className="flex items-center gap-2 px-5 py-10 text-body-sm-regular text-secondary" aria-live="polite">
      <Loader className="size-4 text-tertiary" aria-hidden="true" />
      {t("issue.looper.connect.command.creating")}
    </div>
  );

  const renderCommand = (connected: TLooperConnection) => (
    <div className="space-y-4 px-5 py-4">
      <div>
        <h4 className="text-body-sm-medium text-primary">{t("issue.looper.connect.command.heading")}</h4>
        <p className="mt-1 text-body-xs-regular text-secondary">{t("issue.looper.connect.command.description")}</p>
      </div>
      <div className="rounded-md border border-subtle bg-layer-1 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <code className="font-mono min-w-0 grow text-body-xs-regular break-all text-primary">
            {connected.command}
          </code>
          <Button variant="secondary" size="sm" className="shrink-0" onClick={() => void handleCopy()}>
            {hasCopied ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {hasCopied ? t("issue.looper.connect.copied") : t("issue.looper.connect.command.copy")}
          </Button>
        </div>
      </div>
      <p className="text-caption-md-regular text-tertiary" aria-live="polite">
        {countdownLabel}
      </p>
      <p className="text-caption-md-regular text-tertiary">{t("issue.looper.connect.one_device_note")}</p>
    </div>
  );

  const renderVerifying = (connected: TLooperConnection) => (
    <div className="space-y-4 px-5 py-4">
      <div>
        <h4 className="text-body-sm-medium text-primary">{t("issue.looper.connect.verify.heading")}</h4>
        <p className="mt-1 text-body-xs-regular text-secondary">{t("issue.looper.connect.verify.description")}</p>
      </div>
      {renderChecks(connected, false)}
      <p className="text-body-xs-regular text-secondary" aria-live="polite">
        {connected.status === "binding_created"
          ? t("issue.looper.connect.verify.finishing")
          : t("issue.looper.connect.verify.waiting")}
      </p>
      {countdownLabel && <p className="text-caption-md-regular text-tertiary">{countdownLabel}</p>}
      {isConnectionStale && (
        <p className="text-caption-md-regular text-warning-primary" role="status">
          {t("issue.looper.connect.load_failed")}
        </p>
      )}
    </div>
  );

  const renderCompleted = (connected: TLooperConnection) => (
    <div className="space-y-4 px-5 py-4" aria-live="polite">
      <div>
        <h4 className="text-body-sm-medium text-primary">{t("issue.looper.connect.done.heading")}</h4>
        <p className="mt-1 text-body-xs-regular text-secondary">{t("issue.looper.connect.done.description")}</p>
      </div>
      {renderDevice(connected)}
      {renderChecks(connected, true)}
    </div>
  );

  const renderExistingDevice = (connected: TLooperConnection) => (
    <div className="space-y-4 px-5 py-4" aria-live="polite">
      <div>
        <h4 className="text-body-sm-medium text-primary">{t("issue.looper.connect.existing.heading")}</h4>
        <p className="mt-1 text-body-xs-regular text-secondary">
          {t("issue.looper.connect.existing.description", {
            node: connected.node?.name ?? t("issue.looper.connect.existing.unknown_device"),
          })}
        </p>
      </div>
      {renderDevice(connected)}
    </div>
  );

  const renderOutcome = (heading: string, description: string, tone: "warning" | "danger") => (
    <div className="space-y-3 px-5 py-4" aria-live="assertive">
      <div className="flex items-start gap-2">
        <TriangleAlert
          className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-warning-primary" : "text-danger-primary")}
          aria-hidden="true"
        />
        <div>
          <h4 className="text-body-sm-medium text-primary">{heading}</h4>
          <p className="mt-1 text-body-xs-regular text-secondary">{description}</p>
        </div>
      </div>
      {errorDetail && (
        <details className="rounded-md border border-subtle bg-layer-1 px-3 py-2">
          <summary className="cursor-pointer text-caption-md-regular text-tertiary">
            {t("issue.looper.connect.details")}
          </summary>
          <p className="font-mono mt-2 text-caption-sm-regular break-words text-secondary">{errorDetail}</p>
        </details>
      )}
    </div>
  );

  const renderBody = () => {
    if (isCreating || (!connection && !createErrorCode)) return renderLoading();
    if (!connection)
      return renderOutcome(
        t("issue.looper.connect.failed.heading"),
        t(`issue.looper.connect.error.${errorCode ?? "unknown"}`),
        "danger"
      );
    if (isDeviceExists) return renderExistingDevice(connection);
    if (status === "expired")
      return renderOutcome(
        t("issue.looper.connect.expired.heading"),
        t("issue.looper.connect.expired.description"),
        "warning"
      );
    if (status === "cancelled")
      return renderOutcome(
        t("issue.looper.connect.cancelled.heading"),
        t("issue.looper.connect.cancelled.description"),
        "warning"
      );
    if (status === "failed")
      return renderOutcome(
        t("issue.looper.connect.failed.heading"),
        t(`issue.looper.connect.error.${errorCode ?? "unknown"}`),
        "danger"
      );
    if (status === "completed") return renderCompleted(connection);
    if (status === "created") return renderCommand(connection);
    return renderVerifying(connection);
  };

  const renderFooter = () => {
    if (isDeviceExists || status === "completed")
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            if (status === "completed") onConnected();
            onClose();
          }}
        >
          {status === "completed"
            ? t("issue.looper.connect.done.finish")
            : t("issue.looper.connect.existing.understood")}
        </Button>
      );
    const canRetry = Boolean(createErrorCode) || status === "expired" || status === "failed" || status === "cancelled";
    return (
      <>
        <Button variant="secondary" size="sm" loading={isCancelling} onClick={() => void handleClose()}>
          {t("common.cancel")}
        </Button>
        {canRetry && (
          <Button variant="primary" size="sm" loading={isCreating} onClick={() => void handleRetry()}>
            {status === "expired" ? t("issue.looper.connect.expired.retry") : t("issue.looper.connect.failed.retry")}
          </Button>
        )}
      </>
    );
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => void handleClose()}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      <div className="flex flex-col">
        <div className="border-b border-subtle px-5 py-4">
          <h3 className="text-body-md-medium text-primary">{t("issue.looper.connect.title")}</h3>
          {!isDeviceExists && (
            <p className="mt-1 text-caption-md-regular text-tertiary">
              {t("issue.looper.connect.step_label", { current: step, total: STEP_COUNT })} ·{" "}
              {t(`issue.looper.connect.steps.${STEP_NAMES[step]}`)}
            </p>
          )}
        </div>
        {renderBody()}
        <div className="flex flex-wrap justify-end gap-2 border-t border-subtle px-5 py-4">{renderFooter()}</div>
      </div>
    </ModalCore>
  );
}
