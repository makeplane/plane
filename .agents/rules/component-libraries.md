<!-- Scope: apps/web/**/components/**, apps/web/ce/components/**, apps/admin/**/components/** -->

# Component Libraries & Search-Before-Build

## 🔍 MANDATORY: Search Before You Build

**BEFORE creating ANY new component**, search the codebase for existing equivalents:

```bash
grep -r "ComponentName" packages/propel/ packages/ui/ apps/web/core/components/ apps/web/ce/components/
ls apps/web/core/components/dropdowns/
```

**Existing dropdowns** (USE THEM, don't recreate): `MemberDropdown`, `DateRangeDropdown`, `ProjectDropdown`, `PriorityDropdown`, `StateDropdown`, `LabelDropdown` in `apps/web/core/components/dropdowns/`.

## @plane/propel (Primary — use for new code)

**Import from specific subpath** (NEVER barrel import):

```typescript
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Dialog } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/propel/avatar";
import { Badge } from "@plane/propel/badge";
```

Available exports: `accordion`, `animated-counter`, `avatar`, `badge`, `banner`, `button`, `calendar`, `card`, `charts/*`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `emoji-icon-picker`, `emoji-reaction`, `empty-state`, `icon-button`, `icons`, `input`, `menu`, `pill`, `popover`, `portal`, `scrollarea`, `skeleton`, `switch`, `tab-navigation`, `table`, `tabs`, `toast`, `toolbar`, `tooltip`, `utils`

**Button variants**: `primary`, `secondary`, `tertiary`, `ghost`, `link`, `error-fill`, `error-outline`
**Button sizes**: `sm`, `base`, `lg`, `xl`

## @plane/ui (Legacy — only when propel has no equivalent)

Components ONLY in @plane/ui: `auth-form`, `breadcrumbs`, `color-picker`, `content-wrapper`, `control-link`, `drag-handle`, `drop-indicator`, `dropdown`, `dropdowns`, `favorite-star`, `form-fields`, `header`, `link`, `loader`, `modals`, `oauth`, `popovers`, `progress`, `row`, `sortable`, `tables`, `tag`, `typography`

## Overlapping Components — ALWAYS use propel

`avatar`, `badge`, `button`, `card`, `collapsible`, `tabs`, `tooltip`, `utils`

```typescript
// ❌ WRONG
import { Button } from "@plane/ui";
// ✅ RIGHT
import { Button } from "@plane/propel/button";
```

## Menu / Dropdown / Context Menu

**NEVER build custom hover-based dropdown menus.**

| Component     | Import                       | Use When                  |
| ------------- | ---------------------------- | ------------------------- |
| `CustomMenu`  | `@plane/ui`                  | Action menus in web app   |
| `Menu`        | `@plane/propel/menu`         | Action menus in admin app |
| `ContextMenu` | `@plane/propel/context-menu` | Right-click context menus |

## Icons

- **Primary**: Lucide React (`lucide-react`)
- **Secondary**: Material Symbols Rounded
- **Plane-specific**: `@plane/propel/icons`

## Utilities

```typescript
import { cn } from "@plane/utils"; // conditional classnames
import { observer } from "mobx-react"; // ALWAYS wrap components reading stores
```
