/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TImportHubProviderId } from "@plane/constants";
import JiraLogo from "@/app/assets/services/jira.svg?url";

const LetterMark = ({ label, className }: { label: string; className: string }) => (
  <span
    className={`flex h-10 w-10 items-center justify-center rounded-lg text-14 font-semibold text-white ${className}`}
  >
    {label}
  </span>
);

export function ImportProviderIcon({ providerId }: { providerId: TImportHubProviderId }) {
  if (providerId === "jira" || providerId === "jira_server") {
    return <img src={JiraLogo} alt="" className="h-10 w-10 object-contain" />;
  }
  if (providerId === "linear") {
    return <LetterMark label="L" className="bg-[#5E6AD2]" />;
  }
  if (providerId === "asana") {
    return <LetterMark label="A" className="bg-[#F06A6A]" />;
  }
  return <LetterMark label="C" className="bg-[#7B68EE]" />;
}
