# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Plane backend services.

This package hosts domain-level services that sit between the ORM
and the API/UI layer. The first child is ``workflow`` (P0.2–P0.4);
future services (intake, digests, automations) will live alongside
it.
"""
