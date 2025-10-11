# Tasks: Global Keyboard Shortcut for New Issue

**Input**: Design documents from `/specs/001-add-a-global/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD workflow requested in constitution - tests included for all user stories

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `apps/web/` (Plane monorepo structure)
- Frontend components in `apps/web/core/`
- Tests in `apps/web/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create core hooks directory structure in apps/web/core/hooks/
- [ ] T002 [P] Create test directories for keyboard shortcut feature in apps/web/tests/unit/hooks/ and apps/web/tests/integration/
- [ ] T003 [P] Configure TypeScript types for keyboard events and custom events

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create base keyboard event types and interfaces in apps/web/core/types/keyboard.ts
- [ ] T005 [P] Create focus context utilities in apps/web/core/utils/focus-context.ts
- [ ] T006 [P] Create custom event utilities in apps/web/core/utils/custom-events.ts
- [ ] T007 Setup performance throttling utility in apps/web/core/utils/throttle.ts
- [ ] T008 Create keyboard shortcut constants and configurations in apps/web/core/constants/keyboard-shortcuts.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Issue Creation (Priority: P1) 🎯 MVP

**Goal**: User can press ⌘+N (macOS) or Ctrl+N (Windows/Linux) from anywhere in the app to instantly open the new issue modal

**Independent Test**: Press the keyboard shortcut from any page and verify the new issue modal opens correctly

### Tests for User Story 1 ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] Unit test for useGlobalHotkeys hook in apps/web/tests/unit/hooks/use-global-hotkeys.test.tsx
- [ ] T010 [P] [US1] Integration test for keyboard shortcut modal opening in apps/web/tests/integration/keyboard-shortcuts.test.tsx
- [ ] T011 [P] [US1] Test keyboard event utilities in apps/web/tests/unit/utils/keyboard-events.test.ts

### Implementation for User Story 1

- [ ] T012 [US1] Implement useGlobalHotkeys hook in apps/web/core/hooks/use-global-hotkeys.tsx
- [ ] T013 [US1] Mount useGlobalHotkeys hook in root layout at apps/web/app/layout.tsx
- [ ] T014 [US1] Create keyboard event handler for ⌘+N and Ctrl+N detection
- [ ] T015 [US1] Implement custom event dispatch for 'plane:open-new-issue'
- [ ] T016 [US1] Add event listener to existing New Issue modal component
- [ ] T017 [US1] Add modal state management for keyboard trigger source
- [ ] T018 [US1] Implement duplicate modal prevention logic

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Focus Management (Priority: P2)

**Goal**: User can use keyboard shortcut without interfering with text editing activities

**Independent Test**: Type in various text fields and verify shortcut behavior doesn't interfere with normal text editing workflows

### Tests for User Story 2 ⚠️

- [ ] T019 [P] [US2] Unit test for focus context detection in apps/web/tests/unit/utils/focus-context.test.ts
- [ ] T020 [P] [US2] Integration test for focus preservation during text editing in apps/web/tests/integration/focus-management.test.tsx
- [ ] T021 [P] [US2] Test keyboard shortcut with various input types in apps/web/tests/integration/input-types.test.tsx

### Implementation for User Story 2

- [ ] T022 [US2] Implement editable element detection logic in focus-context.ts
- [ ] T023 [US2] Add focus validation to keyboard event handler in useGlobalHotkeys hook
- [ ] T024 [US2] Implement focus preservation for text input fields
- [ ] T025 [US2] Add special handling for rich text editors and contentEditable elements
- [ ] T026 [US2] Implement focus restoration after modal closes
- [ ] T027 [US2] Add keyboard shortcut throttling to prevent rapid firing

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Visual Feedback and Discovery (Priority: P3)

**Goal**: User can discover the keyboard shortcut through visual cues and understand its availability

**Independent Test**: Check that tooltips and UI hints are present and accurate

### Tests for User Story 3 ⚠️

- [ ] T028 [P] [US3] Unit test for button tooltip enhancement in apps/web/tests/unit/components/button-tooltip.test.tsx
- [ ] T029 [P] [US3] Integration test for tooltip display in apps/web/tests/integration/tooltip-display.test.tsx
- [ ] T030 [P] [US3] Test keyboard shortcut documentation in apps/web/tests/integration/documentation.test.tsx

### Implementation for User Story 3

- [ ] T031 [US3] Enhance Button component with keyboardShortcut prop in apps/web/core/components/ui/button.tsx
- [ ] T032 [US3] Add tooltip display logic for keyboard shortcuts
- [ ] T033 [US3] Update New Issue button with keyboard shortcut tooltip
- [ ] T034 [US3] Add platform-specific tooltip text (⌘+N vs Ctrl+N)
- [ ] T035 [US3] Update help documentation with keyboard shortcuts section
- [ ] T036 [US3] Add accessibility labels for keyboard shortcuts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Documentation updates in apps/web/docs/keyboard-shortcuts.md
- [ ] T038 [P] Code cleanup and refactoring across all keyboard shortcut components
- [ ] T039 [P] Performance optimization for keyboard event handling
- [ ] T040 [P] Additional unit tests for edge cases in apps/web/tests/unit/keyboard-edge-cases.test.tsx
- [ ] T041 Security hardening for keyboard event handling
- [ ] T042 Run quickstart.md validation and user acceptance testing
- [ ] T043 [P] Browser compatibility testing across Chrome, Firefox, Safari, Edge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for modal integration
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for button integration

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Foundation utilities before hook implementation
- Hook implementation before modal integration
- Core implementation before visual enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 2 and 3 can start in parallel (after US1 completes)
- All tests for a user story marked [P] can run in parallel
- Foundation utilities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after dependencies met)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for useGlobalHotkeys hook in apps/web/tests/unit/hooks/use-global-hotkeys.test.tsx"
Task: "Integration test for keyboard shortcut modal opening in apps/web/tests/integration/keyboard-shortcuts.test.tsx"
Task: "Test keyboard event utilities in apps/web/tests/unit/utils/keyboard-events.test.ts"

# Launch foundation utilities in parallel:
Task: "Create focus context utilities in apps/web/core/utils/focus-context.ts"
Task: "Create custom event utilities in apps/web/core/utils/custom-events.ts"
Task: "Setup performance throttling utility in apps/web/core/utils/throttle.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 2 (after US1 completes)
   - Developer C: User Story 3 (after US1 completes)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow TDD workflow: Write failing tests first, then implement
- All tasks include exact file paths for immediate execution
