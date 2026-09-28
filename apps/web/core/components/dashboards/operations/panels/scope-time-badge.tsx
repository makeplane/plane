/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TScopeTimeKind = "snapshot" | "period";

const COPY: Record<TScopeTimeKind, { label: string; hint: string }> = {
  snapshot: {
    label: "Hiện tại",
    hint: "Trạng thái việc ngay bây giờ — không đổi theo kỳ bạn chọn phía trên.",
  },
  period: {
    label: "Trong kỳ",
    hint: "Tính theo kỳ thời gian đã chọn ở thanh điều khiển.",
  },
};

export function ScopeTimeBadge({ kind }: { kind: TScopeTimeKind }): React.ReactElement {
  const { label, hint } = COPY[kind];
  return (
    <span
      className="shrink-0 rounded-full border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary"
      title={hint}
      data-testid={`scope-time-badge-${kind}`}
    >
      {label}
    </span>
  );
}
