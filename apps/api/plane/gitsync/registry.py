# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from typing import Any

MODULE_TESTHUB = "testhub"
MODULE_FEATURES = "features"
MODULE_WIKI = "wiki"
MODULE_PRD = "prd"

MODULE_KEYS = (MODULE_TESTHUB, MODULE_FEATURES, MODULE_WIKI, MODULE_PRD)

# Product modules that read a bound git workdir and never mutate git from Plane.
MODULE_REGISTRY: dict[str, dict[str, Any]] = {
    MODULE_TESTHUB: {
        "key": MODULE_TESTHUB,
        "source": "git_sync",
        "mutate_git": False,
        "capabilities": ["exec_whitelist"],
        "convention_key": "gitsync.conventions.testhub",
    },
    MODULE_FEATURES: {
        "key": MODULE_FEATURES,
        "source": "git_sync",
        "mutate_git": False,
        "capabilities": [],
        "convention_key": "gitsync.conventions.features",
    },
    MODULE_WIKI: {
        "key": MODULE_WIKI,
        "source": "git_sync",
        "mutate_git": False,
        "capabilities": [],
        "convention_key": "gitsync.conventions.wiki",
    },
    MODULE_PRD: {
        "key": MODULE_PRD,
        "source": "git_sync",
        "mutate_git": False,
        "capabilities": [],
        "convention_key": "gitsync.conventions.prd",
    },
}


def module_catalog() -> list[dict[str, Any]]:
    return [dict(MODULE_REGISTRY[key]) for key in MODULE_KEYS]


def is_known_module(module_key: str) -> bool:
    return module_key in MODULE_REGISTRY
