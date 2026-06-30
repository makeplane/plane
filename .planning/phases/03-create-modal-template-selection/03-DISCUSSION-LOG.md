# Phase 3: Create Modal Template Selection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 03-create-modal-template-selection
**Areas discussed:** Selector placement and shape, Template preview before selection, Selected template state and clearing, Loading empty error fallback, Form payload and templateId prop

---

## Selector Placement And Shape

| Question                                                      | Options Considered                                                                                          | Selected                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------- |
| Where should the selector appear in the create Project modal? | Compact button on the cover; explicit dropdown in the form; template selection panel before the form; other | Compact button on the cover |
| What should the compact button look like?                     | Icon + text; icon only with tooltip; pill with template name or no-template state; other                    | Icon + text                 |
| What layout should the dropdown use?                          | Simple searchable dropdown; grouped Built-in/Custom dropdown; wider popover with inline summary; other      | Simple searchable dropdown  |
| How should it behave on mobile?                               | Same compact cover button; icon-only on mobile; move selector into the form on mobile; other                | Same compact cover button   |

**User's choice:** Use the current cover-header stub location. Show icon plus text, display `Template` before selection and the truncated selected template name after selection. Use a simple searchable dropdown on both desktop and mobile.

**Notes:** This keeps the create modal layout stable and reuses the existing `ProjectTemplateSelect` insertion point.

---

## Template Preview Before Selection

| Question                                                    | Options Considered                                                                                                 | Selected                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| How much summary should each option show?                   | Name and short description; name, description, and counts; detailed section preview; other                         | Name and short description     |
| How should CAT-06 be satisfied in Phase 3?                  | Description is primary summary; counts in tooltip/secondary text when possible; counts required but compact; other | Description is primary summary |
| Should built-in/custom templates be visually distinguished? | Small badge; no badge; group headers; other                                                                        | No badge                       |
| What if a template has no description?                      | Show only the name; fallback `No description`; fallback by template type; other                                    | Show only the name             |

**User's choice:** Keep options lightweight: name plus description when available. Do not require counts, badges, groups, or fallback copy.

**Notes:** This intentionally keeps the selector compact and prevents the create flow from becoming a template inspection surface.

---

## Selected Template State And Clearing

| Question                                         | Options Considered                                                                        | Selected                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------- |
| Where should selected state be visible?          | On the cover selector button; selector plus form line; modal banner; other                | On the cover selector button  |
| How should users clear selection?                | Dropdown option `No template`; small X on selector; no separate clear; other              | Dropdown option `No template` |
| Should changing template before submit warn?     | No warning; warn only if future auto-fill exists; always confirm; other                   | No warning                    |
| How should selection reset when reopening modal? | Reset no-template each open; keep within session; use `templateId` prop if present; other | Reset no-template each open   |

**User's choice:** Selection is visible through the cover button label. Clearing happens through `No template`. Template changes before submit are lightweight and need no warning. Reopening the modal starts fresh with no template selected.

**Notes:** Template selection does not mutate anything until submit, so warnings would add friction without protecting data.

---

## Loading Empty Error Fallback

| Question                                  | Options Considered                                                                              | Selected                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| What happens while templates are loading? | Clickable selector with `Loading...` in dropdown; disable selector; spinner on selector; other  | Clickable selector with `Loading...` in dropdown |
| What happens when the list is empty?      | Dropdown with `No template` and empty text; hide selector; disable selector with tooltip; other | Dropdown with `No template` and empty text       |
| What happens when the list API errors?    | Inline dropdown error, no toast; toast plus no-template fallback; disable selector; other       | Inline dropdown error, no toast                  |
| Should there be retry?                    | Small Retry button in dropdown; no retry; automatic background retry; other                     | Small Retry button in dropdown                   |

**User's choice:** Loading, empty, and error states stay inside the selector dropdown and never block no-template Project creation.

**Notes:** No toast should be shown for template list errors because the user may only want the ordinary no-template create flow.

---

## Form Payload And TemplateId Prop

| Question                                              | Options Considered                                                                      | Selected                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------- |
| How should Phase 3 handle existing `templateId` prop? | Ignore prop; use as preselect; remove prop if unused; other                             | Ignore prop                        |
| What should no-template payload send?                 | Omit `template_id`; send `template_id: null`; keep field but strip before submit; other | Omit `template_id`                 |
| Where should selector state live?                     | Local state in `CreateProjectForm`; React Hook Form field; MobX Project store; other    | Local state in `CreateProjectForm` |
| Should success UI differ after template creation?     | No different UI; success copy mentions template; skip feature-selection; other          | No different UI                    |

**User's choice:** Phase 3 ignores the existing `templateId` prop, stores selection locally in `CreateProjectForm`, omits `template_id` for no-template, merges `template_id` only when selected, and keeps the existing success/feature-selection flow.

**Notes:** This avoids global state and preserves current create Project behavior for the default path.

---

## the agent's Discretion

- Exact icon and UI primitive selection.
- Exact service/hook/store boundary for fetching the template list, as long as API calls use service patterns and transient selector state stays local.
- Exact type names and concise i18n copy.

## Deferred Ideas

None.
