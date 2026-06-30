# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Service-layer helpers for the Plane Django API.

# Keep this package init side-effect free. Importers should reach concrete
# helpers via ``from plane.app.services import project_creation`` (or the
# submodule path) so module load order is predictable.