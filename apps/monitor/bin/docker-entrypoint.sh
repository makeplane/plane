#!/bin/sh
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

set -e
if [ "$(id -u)" = "0" ]; then
  chown -R plane:plane /app
  exec su-exec plane "$0" "$@"
fi

if [ "$IS_AIRGAPPED" = "1" ]; then
  exec prime-monitor start-airgapped
else
  exec prime-monitor start
fi