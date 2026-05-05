# Phase 02 — UI: Modal + Root Update

**Context:** [← plan.md](./plan.md) | Depends on: [Phase 01](./phase-01-i18n-translations.md)

## Overview

- **Priority:** P2
- **Status:** ⏳ Pending
- **Description:** Create the ContactPointModal component and wire it into the Help menu root.

## Key Insights

- `ModalCore` from `@plane/ui` is the correct pattern (same as `ProductUpdatesModal`)
- `EModalPosition.CENTER` + `EModalWidth.MD` — appropriate size for 3-field display
- Copy-to-clipboard: use `navigator.clipboard.writeText()` with brief "Copied!" feedback (500ms timeout)
- Keep `root.tsx` under 150 lines — modal must live in its own file
- Hardcoded contact values: Name=`"Support Team"`, Email=`"support@shbvn.com"`, Phone=`"+84 123 456 789"`
- Use `observer()` even if no MobX store — consistent with codebase pattern

## Architecture

```
root.tsx
  └─ <ContactPointModal isOpen={isContactPointOpen} handleClose={...} />
       └─ ModalCore (from @plane/ui)
            └─ 3 contact rows: [label] [value] [CopyButton]
```

## Related Code Files

### New

- `apps/web/core/components/workspace/sidebar/help-section/contact-point-modal.tsx`

### Modified

- `apps/web/core/components/workspace/sidebar/help-section/root.tsx`
- `apps/web/core/components/workspace/sidebar/help-section/index.ts`

## Implementation Steps

### Step 1 — Create `contact-point-modal.tsx`

```tsx
"use client"; // if needed
import React, { useState } from "react";
import { observer } from "mobx-react";
import { Copy, Check } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

// Static contact info — update values as needed
const CONTACT_INFO = {
  fullName: "Support Team",
  email: "support@shbvn.com",
  phone: "+84 123 456 789",
} as const;

type CopiedField = "fullName" | "email" | "phone" | null;

type Props = { isOpen: boolean; handleClose: () => void };

export const ContactPointModal = observer(function ContactPointModal({ isOpen, handleClose }: Props) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const handleCopy = (field: keyof typeof CONTACT_INFO, key: CopiedField) => {
    navigator.clipboard.writeText(CONTACT_INFO[field]);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const rows = [
    { key: "fullName" as const, label: t("contact_point_full_name"), value: CONTACT_INFO.fullName },
    { key: "email" as const, label: t("contact_point_email"), value: CONTACT_INFO.email },
    { key: "phone" as const, label: t("contact_point_phone"), value: CONTACT_INFO.phone },
  ];

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-6">
        <h3 className="text-base font-semibold text-color-primary mb-4">{t("contact_point")}</h3>
        <div className="space-y-3">
          {rows.map(({ key, label, value }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border border-color-subtle bg-surface-1 px-3 py-2"
            >
              <div>
                <p className="text-xs text-color-secondary">{label}</p>
                <p className="text-sm text-color-primary">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(key, key)}
                className="ml-3 rounded p-1 text-color-secondary hover:bg-layer-1 hover:text-color-primary transition-colors"
                title={t("contact_point_copy")}
              >
                {copiedField === key ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalCore>
  );
});
```

> Note: ~60 lines — well within the 150-line limit.

### Step 2 — Update `root.tsx`

1. Add import: `import { ContactPointModal } from "./contact-point-modal";`
2. Add state: `const [isContactPointOpen, setIsContactPointOpen] = useState(false);`
3. Add modal in JSX (alongside `ProductUpdatesModal`):
   ```tsx
   <ContactPointModal isOpen={isContactPointOpen} handleClose={() => setIsContactPointOpen(false)} />
   ```
4. Replace the `contact_point` `CustomMenu.MenuItem` `onClick`:
   ```tsx
   // BEFORE:
   onClick={() => window.open("mailto:sales@plane.so", "_blank")}
   // AFTER:
   onClick={() => setIsContactPointOpen(true)}
   ```

### Step 3 — Update `index.ts`

Add export:

```ts
export * from "./contact-point-modal";
```

## Todo

- [ ] Create `contact-point-modal.tsx`
- [ ] Update `root.tsx` — state + modal render + onClick
- [ ] Update `index.ts` — export

## Success Criteria

- Clicking "Contact Point" in Help menu opens modal
- Modal shows Full Name, Email, Phone with copy buttons
- Copy button shows checkmark for 1.5s after click
- Closing modal (ESC or backdrop) works correctly
- No TypeScript errors, no lint errors

## Risk Assessment

- **Low risk** — purely additive frontend change, no backend, no store changes
- `navigator.clipboard` requires HTTPS in production (standard for all Plane deployments)

## Security Considerations

- No user input — hardcoded read-only values, no XSS risk
- Clipboard API is browser-standard, no special permissions needed
