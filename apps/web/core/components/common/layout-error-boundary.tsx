/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@plane/propel/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

// Catches render crashes from a single issue layout (list/kanban/spreadsheet/calendar/gantt)
// so a bad group/column shape degrades to a local fallback instead of taking down the whole page.
export class LayoutErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Issue layout crashed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="size-8 text-tertiary" />
          <p className="text-14 text-secondary">Something went wrong while loading this view.</p>
          <Button variant="secondary" size="sm" onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
