# Phase 04: Frontend Components

## Overview

- **Priority**: High
- **Status**: Not started
- Tích hợp nút Opinion vào **từng dòng activity row** (chỉ actor của row đó mới thấy)

## UX Flow (đã được làm rõ)

1. Mỗi dòng activity trong feed (state change, assignee change, v.v.) có **nút Opinion nhỏ** hiện ra khi hover, nằm bên phải dòng activity
2. **Chỉ actor của dòng activity đó** (`activity.actor === currentUser.id`) mới thấy nút này
3. Khi click nút → **inline popover** xuất hiện với 3 lựa chọn sentiment + text input optional
4. Submit → opinion được lưu, row hiển thị **badge sentiment nhỏ** bên cạnh nút (thể hiện opinion đã tồn tại)
5. Click badge (nếu đã có opinion) → mở lại popover để sửa hoặc xoá
6. **Không** thêm timeline item mới — opinion gắn vào dòng activity tương ứng

## Related Code Files

### Tạo mới (CE — trong `apps/web/ce/`)

- `apps/web/ce/components/issues/opinion/opinion-button.tsx` — nút + badge tổng hợp
- `apps/web/ce/components/issues/opinion/opinion-popover.tsx` — popup chọn sentiment + input
- `apps/web/ce/components/issues/opinion/opinion-display.tsx` — badge hiển thị khi đã có opinion
- `apps/web/ce/components/issues/opinion/index.ts` — barrel export

### Sửa đổi (core — minimal)

- `apps/web/core/components/issues/issue-detail/issue-activity/activity/actions/helpers/activity-block.tsx` — thêm `actionSlot?: ReactNode` prop vào type + render trong JSX

> ✅ **Validation Session 1**: Dùng **render slot pattern** thay vì import CE components vào core. `activity-block.tsx` chỉ thêm `actionSlot?: ReactNode` prop — không có CE import. CE parent components (IssueActivityItem, v.v.) pass `<OpinionButton>` vào slot.

<!-- Updated: Validation Session 1 - Use actionSlot render slot instead of direct OpinionButton import in core -->

## Embedded Rules

1. **`observer()` wrapper** — MỌI component đọc MobX store PHẢI được wrap bằng `observer()`.
2. **Semantic tokens ONLY** — KHÔNG hardcode colors:
   - `bg-surface-1`, `bg-surface-2`, `bg-layer-2` cho backgrounds
   - `text-color-primary`, `text-color-secondary`, `text-color-tertiary` cho text
   - `border-color-primary`, `border-color-subtle` cho borders
   - ❌ `text-tertiary` (sai) → ✅ `text-color-tertiary`
3. **`bg-layer-2` cho inputs** — text input dùng `bg-layer-2`
4. **`t()` cho mọi string** — dùng `useTranslation()` + `t("opinion.*")`
5. **`setToast()` sau mutations** — luôn show toast sau create/update/delete
6. **`@plane/propel/toast`** — subpath import (không phải barrel)
7. **Components < 150 lines** — mỗi file max 150 dòng, tách nếu quá
8. **Không tạo custom dropdown/modal** — dùng `CustomMenu` hoặc built-in Popover
9. **Lazy fetch** — gọi `fetchOpinion(activityId)` khi user hover/click nút lần đầu, không fetch trước

## Implementation Steps

### Step 1 — `opinion-display.tsx` (badge sentiment đơn giản)

```tsx
// apps/web/ce/components/issues/opinion/opinion-display.tsx
import { observer } from "mobx-react";
import { ThumbsUp, Minus, ThumbsDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TOpinionSentiment } from "@plane/types";
import { cn } from "@plane/utils";

type Props = {
  sentiment: TOpinionSentiment;
  content?: string;
  className?: string;
};

const CONFIG: Record<
  TOpinionSentiment,
  { Icon: React.FC<{ className?: string }>; colorClass: string; labelKey: string }
> = {
  approve: { Icon: ThumbsUp, colorClass: "text-green-600 bg-green-500/10", labelKey: "opinion.approve" },
  neutral: { Icon: Minus, colorClass: "text-color-secondary bg-surface-2", labelKey: "opinion.neutral" },
  reject: { Icon: ThumbsDown, colorClass: "text-red-600 bg-red-500/10", labelKey: "opinion.reject" },
};

export const OpinionDisplay = observer(function OpinionDisplay({ sentiment, content, className }: Props) {
  const { t } = useTranslation();
  const { Icon, colorClass, labelKey } = CONFIG[sentiment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium border border-color-subtle",
        colorClass,
        className
      )}
      title={content || t(labelKey)}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      {t(labelKey)}
    </span>
  );
});
```

### Step 2 — `opinion-popover.tsx` (inline popup chọn sentiment)

```tsx
// apps/web/ce/components/issues/opinion/opinion-popover.tsx
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { ThumbsUp, Minus, ThumbsDown, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueOpinion, TOpinionSentiment } from "@plane/types";
import { cn } from "@plane/utils";
import { useOpinion } from "@/plane-web/hooks/store/use-opinion";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityId: string;
  existingOpinion?: TIssueOpinion;
  onClose: () => void;
};

const SENTIMENTS: {
  value: TOpinionSentiment;
  labelKey: string;
  Icon: React.FC<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "approve",
    labelKey: "opinion.approve",
    Icon: ThumbsUp,
    activeClass: "bg-green-500/10 text-green-600 border-green-500/40",
  },
  {
    value: "neutral",
    labelKey: "opinion.neutral",
    Icon: Minus,
    activeClass: "bg-surface-2 text-color-secondary border-color-primary",
  },
  {
    value: "reject",
    labelKey: "opinion.reject",
    Icon: ThumbsDown,
    activeClass: "bg-red-500/10 text-red-600 border-red-500/40",
  },
];

export const OpinionPopover = observer(function OpinionPopover(props: Props) {
  const { workspaceSlug, projectId, issueId, activityId, existingOpinion, onClose } = props;
  const { t } = useTranslation();
  const store = useOpinion();

  const [sentiment, setSentiment] = useState<TOpinionSentiment>(existingOpinion?.sentiment ?? "neutral");
  const [content, setContent] = useState(existingOpinion?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await store.upsertOpinion(workspaceSlug, projectId, issueId, activityId, { sentiment, content });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("opinion.saved"), message: t("opinion.saved_successfully") });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error"), message: t("opinion.save_failed") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingOpinion) return;
    setSubmitting(true);
    try {
      await store.deleteOpinion(workspaceSlug, projectId, issueId, activityId, existingOpinion.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("opinion.deleted"), message: t("opinion.deleted_successfully") });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error"), message: t("opinion.delete_failed") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-color-primary bg-surface-1 p-3 shadow-xl">
      {/* Sentiment buttons */}
      <div className="flex items-center gap-1.5 mb-2">
        {SENTIMENTS.map(({ value, labelKey, Icon, activeClass }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSentiment(value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
              "border-color-subtle text-color-tertiary hover:bg-surface-2",
              sentiment === value && activeClass
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Note input */}
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("opinion.content_placeholder")}
        className="w-full rounded-md border border-color-subtle bg-layer-2 px-2.5 py-1.5 text-xs text-color-primary placeholder:text-color-tertiary outline-none focus:border-color-primary mb-2"
      />

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="rounded-md bg-surface-2 px-3 py-1 text-xs font-medium text-color-primary hover:bg-layer-3 disabled:opacity-50"
          >
            {submitting ? t("common.saving") : t("common.save")}
          </button>
          {existingOpinion && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleDelete()}
              className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              {t("delete")}
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-color-tertiary hover:text-color-secondary">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});
```

### Step 3 — `opinion-button.tsx` (nút hiển thị trên mỗi row)

```tsx
// apps/web/ce/components/issues/opinion/opinion-button.tsx
import { useState } from "react";
import { observer } from "mobx-react";
import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { useOpinion } from "@/plane-web/hooks/store/use-opinion";
import { OpinionDisplay } from "./opinion-display";
import { OpinionPopover } from "./opinion-popover";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityId: string;
  isActor: boolean; // true nếu currentUser === activity.actor
};

export const OpinionButton = observer(function OpinionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, activityId, isActor } = props;
  const { t } = useTranslation();
  const store = useOpinion();
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Chỉ render nếu current user là actor của dòng activity này
  if (!isActor) return null;

  const opinion = store.getOpinionForActivity(activityId);

  const handleOpen = async () => {
    // Lazy fetch: chỉ gọi lần đầu
    if (!hasFetched) {
      await store.fetchOpinion(workspaceSlug, projectId, issueId, activityId);
      setHasFetched(true);
    }
    setIsOpen(true);
  };

  return (
    <div className="relative flex-shrink-0">
      {opinion ? (
        // Hiển thị badge nếu đã có opinion → click để sửa
        <button type="button" onClick={() => void handleOpen()} className="flex-shrink-0">
          <OpinionDisplay sentiment={opinion.sentiment} content={opinion.content} />
        </button>
      ) : (
        // Nút thêm opinion (hiện khi hover row)
        <Tooltip tooltipContent={t("opinion.add_opinion")}>
          <button
            type="button"
            onClick={() => void handleOpen()}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs",
              "text-color-tertiary hover:text-color-secondary hover:bg-surface-2 border border-transparent hover:border-color-subtle"
            )}
          >
            <MessageSquarePlus className="h-3 w-3" />
            {t("opinion.your_opinion")}
          </button>
        </Tooltip>
      )}

      {isOpen && (
        <OpinionPopover
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          activityId={activityId}
          existingOpinion={opinion}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});
```

### Step 4 — Barrel `index.ts`

```typescript
// apps/web/ce/components/issues/opinion/index.ts
export { OpinionButton } from "./opinion-button";
export { OpinionDisplay } from "./opinion-display";
export { OpinionPopover } from "./opinion-popover";
```

### Step 5 — Tích hợp vào `activity-block.tsx` (render slot pattern)

<!-- Updated: Validation Session 1 - Use actionSlot render slot instead of direct CE import in core -->

Trong `apps/web/core/components/issues/issue-detail/issue-activity/activity/actions/helpers/activity-block.tsx`:

**CHỈ thêm `actionSlot` prop — không import bất kỳ CE component nào:**

```tsx
type TIssueActivityBlockComponent = {
  icon?: ReactNode;
  activityId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
  actionSlot?: ReactNode; // CE injects <OpinionButton> here
};
```

**Trong JSX — thêm `group` class và render slot:**

```tsx
<div
  className={`group relative flex items-center gap-3 text-caption-sm-regular ${
    ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
  }`}
>
  {/* ... existing icon và content ... */}
  {actionSlot}
</div>
```

> ✅ Không có CE import trong core. Core chỉ biết `actionSlot?: ReactNode`.

### Step 6 — CE parent injects `<OpinionButton>` vào slot

CE side (e.g. action components hoặc `activity-list.tsx`) truyền `actionSlot`:

```tsx
import { OpinionButton } from "@/plane-web/components/issues/opinion";

<IssueActivityBlockComponent
  activityId={activityId}
  ends={ends}
  actionSlot={
    <OpinionButton
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      activityId={activityId}
      actorId={activity.actor}
    />
  }
/>;
```

`OpinionButton` nhận `actorId` và tự kiểm tra `isActor = actorId === currentUser.id`:

- Nếu là actor: hiển thị nút add/edit opinion
- Nếu không phải actor: hiển thị `OpinionDisplay` badge read-only (nếu opinion tồn tại), hoặc null

## Post-Phase Checklist

- [ ] `observer()` bao quanh MỌI component đọc MobX store
- [ ] KHÔNG có hardcoded colors (`bg-white`, `text-gray-*`, etc.)
- [ ] Tất cả strings dùng `t("opinion.*")`
- [ ] `setToast()` sau upsert và delete
- [ ] `@plane/propel/toast` (subpath import)
- [ ] `bg-layer-2` cho input text field
- [ ] `isActor` guard: nút add/edit chỉ hiển thị với actor; non-actor thấy badge read-only (nếu có opinion)
- [ ] Opinions được batch-load khi activity feed mount (không lazy fetch per row)
- [ ] `group` class được thêm vào outer div của activity-block để hover effect hoạt động
- [ ] `OpinionButton` nằm ngoài `.truncate` div (để không bị cắt)
- [ ] Components < 150 lines
- [ ] `actionSlot` render slot pattern — core không import CE components
- [ ] `OpinionButton` nhận `actorId` prop (không phải `isActor` boolean)

## Success Criteria

- Hover vào activity row → nút "Your opinion" xuất hiện (chỉ với actor của row đó)
- Click nút → popover mở với 3 sentiment buttons + text input
- Submit → opinion lưu, badge sentiment xuất hiện thay cho nút
- Click badge → popover mở với sentiment/content hiện tại (cho phép sửa/xoá)
- User khác không thấy nút (chỉ actor của row mới thấy)
