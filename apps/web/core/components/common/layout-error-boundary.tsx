/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Component, Fragment } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { WarningTriangleOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  retryKey: number;
};

function LayoutErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <WarningTriangleOutline className="size-8 text-tertiary" />
      <p className="text-14 text-secondary">{t("something_went_wrong")}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}

// Catches render crashes from a single issue layout (list/kanban/spreadsheet/calendar/gantt)
// so a bad group/column shape degrades to a local fallback instead of taking down the whole page.
export class LayoutErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Issue layout crashed", error, info);
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, retryKey: prev.retryKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return <LayoutErrorFallback onRetry={this.handleRetry} />;
    }
    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
