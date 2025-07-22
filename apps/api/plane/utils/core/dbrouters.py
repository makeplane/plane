"""
Database router for read replica selection.
This router determines which database to use for read/write operations
based on the request context set by the ReadReplicaRoutingMiddleware.
"""

import logging
from typing import Type

from django.db import models

from .request_scope import should_use_read_replica

logger = logging.getLogger("plane.db")


class ReadReplicaRouter:
    """
    Database router that directs read operations to replica when appropriate.
    This router works in conjunction with ReadReplicaRoutingMiddleware to:
    - Route read operations to replica database when request context allows
    - Always route write operations to primary database
    - Ensure migrations only run on primary database
    """

    def db_for_read(self, model: Type[models.Model], **hints) -> str:
        """
        Determine which database to use for read operations.
        Args:
            model: The Django model class being queried
            **hints: Additional routing hints
        Returns:
            str: Database alias ('replica' or 'default')
        """
        if should_use_read_replica():
            logger.debug(f"Routing read for {model._meta.label} to replica database")
            return "replica"
        else:
            logger.debug(f"Routing read for {model._meta.label} to primary database")
            return "default"

    def db_for_write(self, model: Type[models.Model], **hints) -> str:
        """
        Determine which database to use for write operations.
        All write operations always go to the primary database to ensure
        data consistency and avoid replication lag issues.
        Args:
            model: The Django model class being written to
            **hints: Additional routing hints
        Returns:
            str: Always returns 'default' (primary database)
        """
        logger.debug(f"Routing write for {model._meta.label} to primary database")
        return "default"

    def allow_migrate(
        self, db: str, app_label: str, model_name: str = None, **hints
    ) -> bool:
        """
        Ensure migrations only run on the primary database.
        Args:
            db: Database alias
            app_label: Application label
            model_name: Model name (optional)
            **hints: Additional routing hints
        Returns:
            bool: True if migration is allowed on this database
        """
        # Only allow migrations on the primary database
        allowed = db == "default"
        if not allowed:
            logger.debug(f"Blocking migration for {app_label} on {db} database")
        return allowed
