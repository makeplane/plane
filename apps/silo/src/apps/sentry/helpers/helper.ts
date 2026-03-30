/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TSentryEventWithException } from "@/worker/types";

type TSentryStackFrame = {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
};

export const getSentryEventDescription = (event: TSentryEventWithException) => {
  const { title } = event;
  const exception = event.exception?.values?.[0];
  const message = exception?.value || title;
  const trace = (exception?.stacktrace?.frames ?? [])
    .reverse()
    .map(
      (frame: TSentryStackFrame) =>
        `    at ${frame.function ?? "?"} (${frame.filename ?? "?"}:${frame.lineno ?? "?"}:${frame.colno ?? "?"})`
    )
    .join("\n");
  const prefix = exception?.type ? `${exception.type}: ` : "";

  return `${prefix}${message}${trace ? `\n${trace}` : ""}`;
};
