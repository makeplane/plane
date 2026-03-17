#!/usr/bin/env python3
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

"""Comprehensive category-by-category SDK audit"""

import sys
from typing import TypedDict

sys.path.insert(0, "/Users/hemasunderchintada/plane/plane-ee/apps/pi")

from plane import PlaneClient

from pi.services.actions.plane_sdk_adapter import PlaneSDKAdapter


class AuditResult(TypedDict):
    category: str
    status: str
    sdk_count: int
    adapter_count: int
    matched: int
    missing: list[str]
    phantom: list[str]


client = PlaneClient(api_key="test", base_url="https://api.plane.so")

# Define all categories to check
categories = {
    "projects": (client.projects, ["_project"]),
    "cycles": (client.cycles, ["_cycle"]),
    "modules": (client.modules, ["_module"]),
    "work_items": (client.work_items, ["_work_item", "_workitem"]),
    "labels": (client.labels, ["_label"]),
    "states": (client.states, ["_state"]),
    "pages": (client.pages, ["_page"]),
    "users": (client.users, ["_user"]),
}

print("=" * 80)
print("COMPREHENSIVE CATEGORY-BY-CATEGORY SDK AUDIT")
print("=" * 80)

all_results: list[AuditResult] = []

for cat_name, (sdk_obj, adapter_patterns) in categories.items():
    # Get actual SDK methods
    sdk_methods = sorted([m for m in dir(sdk_obj) if not m.startswith("_") and m not in ["base_path", "config", "session"]])

    # Get adapter methods
    adapter_methods = []
    for name in dir(PlaneSDKAdapter):
        if name.startswith("_") or name == "client":
            continue
        # Check if method matches this category
        for pattern in adapter_patterns:
            if pattern in name.lower():
                adapter_methods.append(name)
                break

    adapter_methods = sorted(set(adapter_methods))

    # Map adapter methods to SDK methods
    matched = []
    unmatched_adapter = []
    unmatched_sdk = []

    for sdk_m in sdk_methods:
        # Try to find matching adapter method
        # Pattern: category + sdk_method -> e.g., create_project for 'create'
        expected_adapter = f"{sdk_m}_{cat_name[:-1]}" if cat_name.endswith("s") else f"{sdk_m}_{cat_name}"
        if expected_adapter in adapter_methods:
            matched.append((sdk_m, expected_adapter))
        else:
            # Try other patterns
            found = False
            for am in adapter_methods:
                if sdk_m in am or am.endswith(f"_{sdk_m}"):
                    matched.append((sdk_m, am))
                    found = True
                    break
            if not found:
                unmatched_sdk.append(sdk_m)

    # Find adapter methods not matched
    matched_adapter_methods = [m[1] for m in matched]
    unmatched_adapter = [m for m in adapter_methods if m not in matched_adapter_methods]

    # Print results
    status = "✅" if len(sdk_methods) == len(matched) and len(unmatched_adapter) == 0 else "❌"
    print(f"\n{status} {cat_name.upper()}")
    print(f"  Actual SDK: {len(sdk_methods)} methods")
    print(f"  Adapter: {len(adapter_methods)} methods ({len(matched)} matched)")

    if unmatched_sdk:
        print("  ⚠️  Missing in adapter:")
        for m in unmatched_sdk:
            print(f"      - {m}")

    if unmatched_adapter:
        print("  ⚠️  Phantom in adapter:")
        for m in unmatched_adapter:
            print(f"      - {m}")

    all_results.append(
        {
            "category": cat_name,
            "status": status,
            "sdk_count": len(sdk_methods),
            "adapter_count": len(adapter_methods),
            "matched": len(matched),
            "missing": unmatched_sdk,
            "phantom": unmatched_adapter,
        }
    )

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

total_issues = sum(len(r["missing"]) + len(r["phantom"]) for r in all_results)
perfect = [r for r in all_results if r["status"] == "✅"]

print(f"\nPerfect categories: {len(perfect)}/{len(all_results)}")
print(f"Total issues found: {total_issues}")

if total_issues == 0:
    print("\n✅ ✅ ✅  ALL CATEGORIES HAVE 1-1 PARITY  ✅ ✅ ✅")
else:
    print("\n⚠️  Categories needing attention:")
    for r in all_results:
        if r["status"] == "❌":
            print(f"  - {r['category']}: {len(r['missing'])} missing, {len(r['phantom'])} phantom")
