/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue } from "@plane/types";

export type TDateAlertProps = {
  date: string;
  workItem: TIssue;
  projectId: string;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DateAlert(props: TDateAlertProps) {
  return <></>;
}
