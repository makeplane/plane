/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { WEBSITE_URL } from "@plane/constants";

type TPoweredBy = {
  disabled?: boolean;
};

export function PoweredBy(props: TPoweredBy) {
  // props
  const { disabled = false } = props;

  if (disabled || !WEBSITE_URL) return null;

  return (
    <a
      href={WEBSITE_URL}
      className="fixed right-3 bottom-2 !z-[999999] flex items-center gap-0 px-1 py-0 opacity-20 transition-opacity hover:opacity-40"
      target="_blank"
      rel="noreferrer noopener"
      title="Powered by Plane"
    >
      <div className="text-8 font-light whitespace-nowrap">powered by plane</div>
    </a>
  );
}
