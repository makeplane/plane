"""
Core mixins for read replica functionality.
This package provides mixins for different aspects of read replica management
in Django and Django REST Framework applications.
"""

from .view import ReadReplicaControlMixin

__all__ = [
    "ReadReplicaControlMixin",
]
