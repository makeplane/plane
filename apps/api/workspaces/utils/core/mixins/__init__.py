# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Core mixins for read replica functionality.
This package provides mixins for different aspects of read replica management
in Django and Django REST Framework applications.
"""

from .view import ReadReplicaControlMixin

__all__ = [
    "ReadReplicaControlMixin",
]
