# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workflow service layer — spec §6, §8, §9, §10, §18, §19, §20, §25.

Every state-mutation path in the fork should call into this package
rather than directly mutating ``Issue.state``. The package is the
authoritative implementation of §34's invariant.

Public surface:

- ``resolver`` — effective workflow resolution (§8) per Work Item.
- ``bindings`` — bind / lazy-bind to a workflow revision (§7.7, §25
  Phase 3).
- ``transitions`` — allowed-action computation + transactional state
  transition (§9, §10).
- ``actors`` — actor authorization (§18.2, §18.3).
- ``bootstrap`` — Phase 2/3 default-workflow creation (§25 Phase 2).
- ``errors`` — structured ``WorkflowError`` hierarchy used by every
  service module.
- ``flags`` — instance-level feature flag check.

The runtime gate is a tuple of:

1. ``settings.ENABLE_WORKFLOWS`` (instance flag, defaults off);
2. ``Project.workflow_enabled`` (per-project toggle, defaults off).

When either gate is off, ``TransitionService.transition`` and the
creation helpers behave as no-ops and return their inputs unchanged,
preserving the §17.4 compatibility contract.
"""
