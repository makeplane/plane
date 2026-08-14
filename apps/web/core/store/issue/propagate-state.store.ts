/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeAutoObservable } from "mobx";

type TPropagateStatePrompt = {
  subIssuesCount: number;
  resolve: (propagate: boolean | null) => void;
};

class PropagateStateStore {
  promptData: TPropagateStatePrompt | null = null;
  propagateToSubIssues = false;
  isSubmitting = false;

  constructor() {
    makeAutoObservable(this);
  }

  prompt(subIssuesCount: number): Promise<boolean | null> {
    return new Promise((resolve) => {
      this.propagateToSubIssues = false;
      this.isSubmitting = false;
      this.promptData = { subIssuesCount, resolve };
    });
  }

  setPropagateToSubIssues = action((value: boolean) => {
    this.propagateToSubIssues = value;
  });

  confirm = action(() => {
    this.promptData?.resolve(this.propagateToSubIssues);
    this.promptData = null;
    this.isSubmitting = false;
  });

  cancel = action(() => {
    this.promptData?.resolve(null);
    this.promptData = null;
    this.isSubmitting = false;
  });

  setIsSubmitting = action((value: boolean) => {
    this.isSubmitting = value;
  });
}

export const propagateStateStore = new PropagateStateStore();
