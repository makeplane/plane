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

import { randomBytes, createHash } from "crypto";

/**
 * Generate a cryptographically random code_verifier per RFC 7636.
 * 32 random bytes → 43 base64url characters.
 */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Compute code_challenge = BASE64URL(SHA256(code_verifier)) per RFC 7636.
 * Node.js base64url encoding omits padding by default.
 */
export function computeCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
