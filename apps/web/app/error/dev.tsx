/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { isRouteErrorResponse } from "react-router";
import { Banner } from "@plane/propel/banner";
import { Button } from "@plane/propel/button";
import { Card, ECardVariant } from "@plane/propel/card";
import { InfoFillIcon } from "@plane/propel/icons";

interface ErrorActionsProps {
  onGoHome: () => void;
  onReload?: () => void;
}

function ErrorActions({ onGoHome, onReload }: ErrorActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <Button variant="primary" size="lg" onClick={onGoHome}>
        Go to home
      </Button>
      {onReload && (
        <Button variant="secondary" size="lg" onClick={onReload}>
          Reload page
        </Button>
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
  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-surface-2 p-6 transition-none">
        <div className="mt-12 w-full max-w-4xl space-y-4 transition-none">
          <Banner
            variant="error"
            icon={<InfoFillIcon className="size-5" />}
            title="Route Error Response"
            animationDuration={0}
          />

          <Card variant={ECardVariant.WITH_SHADOW} className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-20 font-semibold text-danger-primary">
                  {error.status} {error.statusText}
                </h2>
                <div className="bg-subtle-1 h-px w-full" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">Error Data</h3>
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
          <Banner
            variant="error"
            icon={<InfoFillIcon className="size-5" />}
            title="Runtime Error"
            animationDuration={0}
          />
          <Card variant={ECardVariant.WITH_SHADOW} className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-20 font-semibold text-danger-primary">Error</h2>
                <div className="bg-subtle-1 h-px w-full" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">Message</h3>
                <div className="rounded-md bg-layer-1 p-4">
                  <p className="text-13 font-medium text-primary">{error.message}</p>
                </div>
              </div>

              {error.stack && (
                <div className="space-y-2">
                  <h3 className="text-13 font-medium tracking-wide text-tertiary uppercase">Stack Trace</h3>
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

          <Card variant={ECardVariant.WITHOUT_SHADOW} className="bg-layer-1 !p-4 transition-none">
            <div className="flex items-start gap-3">
              <InfoFillIcon className="mt-0.5 size-5 flex-shrink-0 text-tertiary" />
              <div className="space-y-1">
                <p className="text-13 font-medium text-secondary">Development Mode</p>
                <p className="text-11 text-tertiary">
                  This detailed error view is only visible in development. In production, users will see a friendly
                  error page.
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
        <Banner
          variant="error"
          icon={<InfoFillIcon className="size-5" />}
          title="Unknown Error"
          animationDuration={0}
        />

        <Card variant={ECardVariant.WITH_SHADOW} className="!p-6">
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-20 font-semibold text-primary">Unknown Error</h2>
              <div className="bg-subtle-1 h-px w-full" />
            </div>

            <div className="rounded-md bg-layer-1 p-4">
              <p className="text-13 text-secondary">
                An unknown error occurred. Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>

            <ErrorActions onGoHome={onGoHome} onReload={onReload} />
          </div>
        </Card>
      </div>
    </div>
  );
}
