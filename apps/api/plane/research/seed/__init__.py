# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Deterministic research test fixtures (P0 + P1).

The package backs the ``seed_research_demo`` management command: ``scenario``
holds pure data, ``builder`` turns it into records, ``verify`` reads the result
back through the production ACL so the fixture can be trusted while testing.
"""

from plane.research.seed.builder import ResearchSeedBuilder, reset_seed, wipe_research_data

__all__ = ["ResearchSeedBuilder", "reset_seed", "wipe_research_data"]
