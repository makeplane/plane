import { useCallback, useState } from "react";
import useSWR from "swr";

import { LooperCollaborationService } from "@/services/issue";

import type { TLooperConnection, TLooperConnectionErrorCode, TLooperConnectionStatus } from "./types";

const looperCollaborationService = new LooperCollaborationService();

/** Statuses the API will never move away from on its own, so polling can stop. */
const SETTLED_STATUSES = new Set<TLooperConnectionStatus>([
  "completed",
  "expired",
  "cancelled",
  "failed",
  "device_exists",
]);

/** Only these two are still inside the connect-code window, so only these can be cancelled. */
const CANCELLABLE_STATUSES = new Set<TLooperConnectionStatus>(["created", "cli_connected"]);

export const isSettledConnectionStatus = (status: TLooperConnectionStatus) => SETTLED_STATUSES.has(status);

const readErrorCode = (error: unknown): { code: TLooperConnectionErrorCode; detail: string | null } => {
  const payload = (error ?? {}) as { error?: string; detail?: string };
  return {
    code: (payload.error as TLooperConnectionErrorCode | undefined) ?? "unknown",
    detail: payload.detail ?? null,
  };
};

export const useLooperConnection = (workspaceSlug: string, projectId: string) => {
  const [connection, setConnection] = useState<TLooperConnection | null>(null);
  const [createErrorCode, setCreateErrorCode] = useState<TLooperConnectionErrorCode | null>(null);
  const [createErrorDetail, setCreateErrorDetail] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const shouldPoll = Boolean(connection && !isSettledConnectionStatus(connection.status));

  const { error: pollError } = useSWR(
    shouldPoll && connection ? `LOOPER_CONNECTION_${workspaceSlug}_${projectId}_${connection.id}` : null,
    () => looperCollaborationService.getConnection(workspaceSlug, projectId, connection!.id),
    {
      refreshInterval: 3_000,
      revalidateOnFocus: true,
      errorRetryInterval: 5_000,
      onSuccess: (data) => setConnection(data),
    }
  );

  const create = useCallback(async () => {
    setIsCreating(true);
    setCreateErrorCode(null);
    setCreateErrorDetail(null);
    try {
      // The API cancels the member's other open sessions, so retrying never leaves stale codes behind.
      setConnection(await looperCollaborationService.createConnection(workspaceSlug, projectId));
    } catch (error) {
      const { code, detail } = readErrorCode(error);
      setConnection(null);
      setCreateErrorCode(code);
      setCreateErrorDetail(detail);
    } finally {
      setIsCreating(false);
    }
  }, [workspaceSlug, projectId]);

  const cancel = useCallback(async () => {
    if (!connection || !CANCELLABLE_STATUSES.has(connection.status)) return true;
    setIsCancelling(true);
    try {
      await looperCollaborationService.cancelConnection(workspaceSlug, projectId, connection.id);
      setConnection({ ...connection, status: "cancelled" });
      return true;
    } catch {
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [workspaceSlug, projectId, connection]);

  /** The countdown owns expiry in the UI so a dead command never keeps the wizard waiting. */
  const markExpired = useCallback(() => {
    setConnection((current) =>
      current && CANCELLABLE_STATUSES.has(current.status)
        ? { ...current, status: "expired", error_code: "connection_expired" }
        : current
    );
  }, []);

  const reset = useCallback(() => {
    setConnection(null);
    setCreateErrorCode(null);
    setCreateErrorDetail(null);
  }, []);

  return {
    connection,
    createErrorCode,
    createErrorDetail,
    isCreating,
    isCancelling,
    isConnectionStale: Boolean(pollError) && shouldPoll,
    create,
    cancel,
    markExpired,
    reset,
  };
};
