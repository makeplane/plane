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
      <div className="min-h-screen bg-surface-2 p-6 flex items-start justify-center transition-none">
        <div className="w-full max-w-4xl mt-12 space-y-4 transition-none">
          <Banner
            variant="error"
            icon={<InfoFillIcon className="size-5" />}
            title="Route Error Response"
            animationDuration={0}
          />

          <Card variant={ECardVariant.WITH_SHADOW} className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="text-20 font-semibold text-danger-primary mb-2">
                  {error.status} {error.statusText}
                </h2>
                <div className="h-px w-full bg-subtle-1" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium text-tertiary uppercase tracking-wide">Error Data</h3>
                <div className="bg-layer-1 rounded-md p-4">
                  <p className="text-13 text-secondary font-code">{error.data}</p>
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
      <div className="min-h-screen bg-surface-2 p-6 flex items-start justify-center transition-none">
        <div className="w-full max-w-4xl mt-12 space-y-4 transition-none">
          <Banner
            variant="error"
            icon={<InfoFillIcon className="size-5" />}
            title="Runtime Error"
            animationDuration={0}
          />
          <Card variant={ECardVariant.WITH_SHADOW} className="!p-6 transition-none">
            <div className="space-y-4">
              <div>
                <h2 className="text-20 font-semibold text-danger-primary mb-2">Error</h2>
                <div className="h-px w-full bg-subtle-1" />
              </div>

              <div className="space-y-2">
                <h3 className="text-13 font-medium text-tertiary uppercase tracking-wide">Message</h3>
                <div className="bg-layer-1 rounded-md p-4">
                  <p className="text-13 text-primary font-medium">{error.message}</p>
                </div>
              </div>

              {error.stack && (
                <div className="space-y-2">
                  <h3 className="text-13 font-medium text-tertiary uppercase tracking-wide">Stack Trace</h3>
                  <div className="bg-layer-1 rounded-md border border-subtle max-h-96 overflow-auto">
                    <pre className="p-4 text-11 text-secondary font-code whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              )}

              <ErrorActions onGoHome={onGoHome} onReload={onReload} />
            </div>
          </Card>

          <Card variant={ECardVariant.WITHOUT_SHADOW} className="!p-4 bg-layer-1 transition-none">
            <div className="flex items-start gap-3">
              <InfoFillIcon className="size-5 text-tertiary flex-shrink-0 mt-0.5" />
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
    <div className="min-h-screen bg-surface-2 p-6 flex items-start justify-center transition-none">
      <div className="w-full max-w-4xl mt-12 space-y-4 transition-none">
        <Banner
          variant="error"
          icon={<InfoFillIcon className="size-5" />}
          title="Unknown Error"
          animationDuration={0}
        />

        <Card variant={ECardVariant.WITH_SHADOW} className="!p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-20 font-semibold text-primary mb-2">Unknown Error</h2>
              <div className="h-px w-full bg-subtle-1" />
            </div>

            <div className="bg-layer-1 rounded-md p-4">
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
