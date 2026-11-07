/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
// plane imports
import { Banner } from "@makeplane/propel/components/banner";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { InputField } from "@makeplane/propel/components/input-field";
import { CopyOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { AGENT_CONNECTION_POLL_INTERVAL_MS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AgentConnectionService } from "@plane/services";
import type { TAgentAccountProvider, TAgentConnectionAccount, TAgentConnectionStart } from "@plane/types";
import { copyTextToClipboard } from "@plane/utils";
// local imports
import { safeExternalUrl, signInErrorReason } from "./helpers";
import type { TSignInErrorReason } from "./helpers";
import { pollLoginStatus } from "./login-poller";

const defaultConnectionService = new AgentConnectionService();

type TConnectionClient = Pick<AgentConnectionService, "start" | "status" | "complete">;

type TPhase =
  | { kind: "starting" }
  /** Waiting for the member to finish on the provider's page; `showDevice` shows the code and link. */
  | { kind: "polling"; login: TAgentConnectionStart; showDevice: boolean }
  /** The provider shows a code the member pastes here. */
  | { kind: "code"; login: TAgentConnectionStart; submitting: boolean }
  | { kind: "failed"; reason: TSignInErrorReason; detail?: string };

type Props = {
  provider: TAgentAccountProvider;
  workspaceSlug: string;
  onClose: () => void;
  onConnected: (account: TAgentConnectionAccount | undefined) => void;
  /** Injectable for tests. */
  service?: TConnectionClient;
  pollIntervalMs?: number;
};

/**
 * Signs the member in to their ChatGPT or Google account through the agent bridge. ChatGPT uses a
 * device code (shown here, entered on OpenAI's page, then polled); Google shows a code on its page
 * that the member pastes back. Closing the dialog stops polling.
 */
export function AgentProviderSignInDialog({
  provider,
  workspaceSlug,
  onClose,
  onConnected,
  service = defaultConnectionService,
  pollIntervalMs = AGENT_CONNECTION_POLL_INTERVAL_MS,
}: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<TPhase>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  // The latest callback, so a new identity from the parent never restarts polling.
  const onConnectedRef = useRef(onConnected);
  useEffect(() => {
    onConnectedRef.current = onConnected;
  });

  // Start (or restart) the sign-in.
  useEffect(() => {
    let active = true;
    setPhase({ kind: "starting" });
    setCode("");
    setCodeError(undefined);
    const begin = async () => {
      try {
        const login = await service.start(provider, workspaceSlug);
        if (!active) return;
        setPhase(
          login.needsCode ? { kind: "code", login, submitting: false } : { kind: "polling", login, showDevice: true }
        );
      } catch (error) {
        if (active) setPhase({ kind: "failed", reason: signInErrorReason(error) });
      }
    };
    void begin();
    return () => {
      active = false;
    };
  }, [service, provider, workspaceSlug, attempt]);

  // Poll while waiting for the member; unmounting (cancel, close) aborts.
  const pollingLoginId = phase.kind === "polling" ? phase.login.loginId : null;
  useEffect(() => {
    if (!pollingLoginId) return;
    const controller = new AbortController();
    const poll = async () => {
      const result = await pollLoginStatus({
        check: (signal) => service.status(provider, workspaceSlug, pollingLoginId, signal),
        intervalMs: pollIntervalMs,
        signal: controller.signal,
      });
      if (result.status === "connected") onConnectedRef.current(result.account);
      else if (result.status === "failed")
        setPhase({ kind: "failed", reason: result.reason, ...(result.error ? { detail: result.error } : {}) });
    };
    void poll();
    return () => controller.abort();
  }, [service, provider, workspaceSlug, pollingLoginId, pollIntervalMs]);

  const submitCode = async () => {
    if (phase.kind !== "code" || phase.submitting) return;
    const value = code.trim();
    if (!value) {
      setCodeError(t("agents.providers.sign_in.code_required"));
      return;
    }
    setCodeError(undefined);
    const { login } = phase;
    setPhase({ kind: "code", login, submitting: true });
    try {
      const result = await service.complete(provider, workspaceSlug, login.loginId, value);
      if (result.status === "connected") onConnected(result.account);
      else if (result.status === "pending") setPhase({ kind: "polling", login, showDevice: false });
      else setPhase({ kind: "failed", reason: "failed", ...(result.error ? { detail: result.error } : {}) });
    } catch (error) {
      setPhase({ kind: "failed", reason: signInErrorReason(error) });
    }
  };

  const copyCode = (userCode: string) => {
    void copyTextToClipboard(userCode).then(() =>
      setToast({ type: "success", title: t("agents.providers.sign_in.code_copied") })
    );
  };

  const signInUrl =
    phase.kind === "polling" || phase.kind === "code" ? safeExternalUrl(phase.login.verificationUrl) : null;
  const openLinkLabel = t(`agents.providers.sign_in.${provider}.open_link`);
  const openLink = signInUrl ? (
    <Button
      variant="secondary"
      size="md"
      stretch="auto"
      nativeButton={false}
      render={<a href={signInUrl} target="_blank" rel="noopener noreferrer" aria-label={openLinkLabel} />}
      label={openLinkLabel}
    />
  ) : null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>{t(`agents.providers.sign_in.${provider}.title`)}</DialogTitle>
              <DialogDescription>{t(`agents.providers.sign_in.${provider}.description`)}</DialogDescription>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-4" aria-live="polite">
              {phase.kind === "starting" && (
                <p className="text-body-sm-regular text-secondary">{t("agents.providers.sign_in.starting")}</p>
              )}

              {phase.kind === "polling" && phase.showDevice && (
                <>
                  <ol className="flex list-decimal flex-col gap-3 pl-5 text-body-sm-regular text-secondary">
                    <li>
                      <div className="flex flex-col items-start gap-2">
                        <span>{t(`agents.providers.sign_in.${provider}.step_open`)}</span>
                        {openLink}
                      </div>
                    </li>
                    {phase.login.userCode && (
                      <li>
                        <div className="flex flex-col items-start gap-2">
                          <span>{t("agents.providers.sign_in.step_enter_code")}</span>
                          <div className="flex items-center gap-2 rounded-md border border-subtle bg-layer-1 px-3 py-2">
                            <code
                              className="tracking-widest text-h5-medium text-primary"
                              aria-label={t("agents.providers.sign_in.code_label")}
                            >
                              {phase.login.userCode}
                            </code>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              icon={<CopyOutline />}
                              aria-label={t("agents.providers.sign_in.copy_code")}
                              onClick={() => copyCode(phase.login.userCode ?? "")}
                            />
                          </div>
                        </div>
                      </li>
                    )}
                  </ol>
                </>
              )}

              {phase.kind === "polling" && (
                <p className="text-body-xs-regular text-tertiary">{t("agents.providers.sign_in.waiting")}</p>
              )}

              {phase.kind === "code" && (
                <form
                  id="agent-provider-sign-in-code-form"
                  className="flex flex-col gap-4"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitCode();
                  }}
                >
                  <ol className="flex list-decimal flex-col gap-3 pl-5 text-body-sm-regular text-secondary">
                    <li>
                      <div className="flex flex-col items-start gap-2">
                        <span>{t(`agents.providers.sign_in.${provider}.step_open`)}</span>
                        {openLink}
                      </div>
                    </li>
                    <li>{t(`agents.providers.sign_in.${provider}.step_paste`)}</li>
                  </ol>
                  <InputField
                    id="agent-provider-sign-in-code"
                    name="code"
                    size="lg"
                    orientation="vertical"
                    label={t("agents.providers.sign_in.code_label")}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={code}
                    {...(codeError ? { error: codeError } : {})}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </form>
              )}

              {phase.kind === "failed" && (
                <Banner
                  placement="inline"
                  variant="danger"
                  title={t(`agents.providers.sign_in.errors.${phase.reason}`)}
                  {...(phase.detail ? { description: phase.detail } : {})}
                />
              )}
            </div>
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label={t("agents.providers.cancel")} onClick={onClose} />
          {phase.kind === "code" && (
            <Button
              type="submit"
              form="agent-provider-sign-in-code-form"
              variant="primary"
              size="md"
              stretch="auto"
              loading={phase.submitting}
              label={t(phase.submitting ? "agents.providers.sign_in.submitting" : "agents.providers.sign_in.submit")}
            />
          )}
          {phase.kind === "failed" && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("agents.providers.sign_in.retry")}
              onClick={() => setAttempt((current) => current + 1)}
            />
          )}
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
