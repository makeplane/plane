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

export type TSetExprCond = {
  kind: "cond";
  field: string;
  op: "=" | "!=" | "IN" | "NOT_IN" | "UNRESOLVED";
  values: string[];
};

export type TSetExpr =
  | { kind: "and"; children: TSetExpr[] }
  | { kind: "or"; children: TSetExpr[] }
  | { kind: "not"; child: TSetExpr }
  | TSetExprCond;

export const unresolvedCond = (): TSetExprCond => ({
  kind: "cond",
  field: "__unresolved__",
  op: "UNRESOLVED",
  values: [],
});
