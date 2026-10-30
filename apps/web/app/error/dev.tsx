/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
import { isRouteErrorResponse } from "react-router";
import { Banner } from "@makeplane/propel/components/banner";
import { InfoFilled } from "@makeplane/propel/icons";
import { Button } from "@makeplane/propel/components/button";
import { Card } from "@plane/blocks/card";

interface ErrorActionsProps {
  onGoHome: () => void;
  onReload?: () => void;
}

function ErrorActions({ onGoHome, onReload }: ErrorActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="primary"
        size="md"
        stretch="auto"
        label={t("power_k.navigation_actions.nav_home")}
        onClick={onGoHome}
      />
      {onReload && (
        <Button variant="secondary" size="md" stretch="auto" label={t("web_ui.reload_page")} onClick={onReload} />
      )}
    </div>
  );
}

interface DevErrorComponentProps {
  error: unknown;
  onGoHome: () => void;
  onReload: () => void;
}

export function DevErrorComponent({ error, onGoHome, onReload }: DevErrorComponentProps) {
  const { t } = useTranslation();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-surface-2 p-6 transition-none">
        <div className="mt-12 w-full max-w-4xl space-y-4 transition-none">
          <Banner placement="page" variant="danger" icon={<InfoFilled />} title={t("web_ui.route_error_response")} />

          <Card variant="with-shadow" className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-20 font-semibold text-danger-primary">
                  {error.status} {error.statusText}
                </h2>
                <div className="bg-subtle-1 h-px w-full" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">{t("web_ui.error_data")}</h3>
                <div className="rounded-md bg-layer-1 p-4">
                  <p className="font-code text-13 text-secondary">{error.data}</p>
                </div>
              </div>

              <ErrorActions onGoHome={onGoHome} onReload={onReload} />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-surface-2 p-6 transition-none">
        <div className="mt-12 w-full max-w-4xl space-y-4 transition-none">
          <Banner placement="page" variant="danger" icon={<InfoFilled />} title={t("web_ui.runtime_error")} />
          <Card variant="with-shadow" className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-20 font-semibold text-danger-primary">{t("error")}</h2>
                <div className="bg-subtle-1 h-px w-full" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">{t("web_ui.message")}</h3>
                <div className="rounded-md bg-layer-1 p-4">
                  <p className="text-13 font-medium text-primary">{error.message}</p>
                </div>
              </div>

              {error.stack && (
                <div className="space-y-2">
                  <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">
                    {t("web_ui.stack_trace")}
                  </h3>
                  <div className="max-h-96 overflow-auto rounded-md border border-subtle bg-layer-1">
                    <pre className="p-4 font-code text-11 break-words whitespace-pre-wrap text-secondary">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              )}

              <ErrorActions onGoHome={onGoHome} onReload={onReload} />
            </div>
          </Card>

          <Card variant="without-shadow" className="bg-layer-1 !p-4 transition-none">
            <div className="flex items-start gap-3">
              <InfoFilled className="mt-0.5 size-5 flex-shrink-0 text-tertiary" />
              <div className="space-y-1">
                <p className="text-13 font-medium text-secondary">{t("web_ui.development_mode")}</p>
                <p className="text-11 text-tertiary">
                  {t(
                    "web_ui.this_detailed_error_view_is_only_visible_in_development_in_production_users_will_see_a_fri"
                  )}{" "}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-surface-2 p-6 transition-none">
      <div className="mt-12 w-full max-w-4xl space-y-4 transition-none">
        <Banner placement="page" variant="danger" icon={<InfoFilled />} title={t("web_ui.unknown_error")} />

        <Card variant="with-shadow" className="!p-6">
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-20 font-semibold text-primary">{t("web_ui.unknown_error")}</h2>
              <div className="bg-subtle-1 h-px w-full" />
            </div>

            <div className="rounded-md bg-layer-1 p-4">
              <p className="text-13 text-secondary">
                {t(
                  "web_ui.an_unknown_error_occurred_please_try_refreshing_the_page_or_contact_support_if_the_problem"
                )}{" "}
              </p>
            </div>

            <ErrorActions onGoHome={onGoHome} onReload={onReload} />
          </div>
        </Card>
      </div>
    </div>
  );
}
