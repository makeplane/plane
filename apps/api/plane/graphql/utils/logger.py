# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python Imports
import logging
from typing import Optional

# Strawberry Imports
from strawberry.types import Info

logger = logging.getLogger("plane.graphql")
exception_logger = logging.getLogger("plane.graphql.exception")


def log_graphql_error(message: str, error: Optional[Exception] = None):
    exception_logger.error(message, exc_info=error)
    return


def log_graphql_warning(message: str):
    logger.warning(message)
    return


def log_graphql_info(message: str, info: Optional[Info] = None):
    logger.info(f"Info in GraphQL: {message}", extra={"info": info})
    return
