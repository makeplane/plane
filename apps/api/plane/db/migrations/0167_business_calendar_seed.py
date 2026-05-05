# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Data migration: seed Vietnam Banking default WorkSchedule + 2025/2026 MOLISA holidays
and 2025 swap-day overrides.

NOTE: Lunar-calendar holidays for 2026 (Tết, Giỗ Tổ) are best-estimate placeholders.
An instance admin MUST verify dates against the official MOLISA announcement before
the year begins and adjust via God-Mode UI if needed.
"""

import uuid
from datetime import date

from django.db import migrations


# ---------------------------------------------------------------------------
# Seed data — sourced from MOLISA official announcements
# ---------------------------------------------------------------------------

VN_HOLIDAYS_2025 = [
    (date(2025, 1, 1), "Tết Dương lịch"),
    # Tết Nguyên Đán Ất Tỵ — MOLISA announced 7 days off 27/1–2/2 (5 official + 2 swap)
    # Official lễ: 28/1 (giao thừa) through 1/2 (mùng 4)
    (date(2025, 1, 28), "Tết Nguyên Đán (giao thừa)"),
    (date(2025, 1, 29), "Tết Nguyên Đán (mùng 1)"),
    (date(2025, 1, 30), "Tết Nguyên Đán (mùng 2)"),
    (date(2025, 1, 31), "Tết Nguyên Đán (mùng 3)"),
    (date(2025, 2, 1), "Tết Nguyên Đán (mùng 4)"),
    (date(2025, 2, 2), "Tết Nguyên Đán (mùng 5)"),
    (date(2025, 2, 3), "Tết Nguyên Đán (mùng 6)"),
    # Giỗ Tổ Hùng Vương — 10/3 âm lịch = 7/4/2025 dương lịch
    (date(2025, 4, 7), "Giỗ Tổ Hùng Vương (10/3 ÂL)"),
    # Giải Phóng + Quốc tế Lao động cluster (30/4–4/5 off; 26/4 T7 làm bù)
    (date(2025, 4, 30), "Giải Phóng Miền Nam"),
    (date(2025, 5, 1), "Quốc tế Lao động"),
    (date(2025, 5, 2), "Nghỉ bù (hoán đổi 26/4)"),
    # Quốc khánh cluster (1–4/9 off)
    (date(2025, 9, 1), "Quốc khánh (nghỉ bù)"),
    (date(2025, 9, 2), "Quốc khánh"),
]

# 2025 MOLISA swap-day overrides:
# 26/4/2025 (Thứ Bảy) → WORKDAY (làm bù cho 2/5)
# 27/4/2025 (Chủ Nhật) → WORKDAY (làm bù cho 30/4)
VN_OVERRIDES_2025 = [
    {
        "date": date(2025, 4, 26),
        "type": "WORKDAY",
        "reason": "Làm bù cho ngày nghỉ 2/5/2025",
        "swap_with_date": date(2025, 5, 2),
    },
    {
        "date": date(2025, 4, 27),
        "type": "WORKDAY",
        "reason": "Làm bù cho ngày nghỉ 30/4/2025",
        "swap_with_date": date(2025, 4, 30),
    },
]

# NOTE: 2026 dates are placeholders — verify against official MOLISA announcement.
# Tết Bính Ngọ: estimated 16/2–22/2/2026 (giao thừa 15/2 + 7 days).
# Giỗ Tổ: 10/3 ÂL → estimated 26/4/2026.
VN_HOLIDAYS_2026 = [
    (date(2026, 1, 1), "Tết Dương lịch"),
    # Tết Nguyên Đán Bính Ngọ — placeholder, verify with MOLISA
    (date(2026, 2, 15), "Tết Nguyên Đán (giao thừa) [placeholder]"),
    (date(2026, 2, 16), "Tết Nguyên Đán (mùng 1) [placeholder]"),
    (date(2026, 2, 17), "Tết Nguyên Đán (mùng 2) [placeholder]"),
    (date(2026, 2, 18), "Tết Nguyên Đán (mùng 3) [placeholder]"),
    (date(2026, 2, 19), "Tết Nguyên Đán (mùng 4) [placeholder]"),
    (date(2026, 2, 20), "Tết Nguyên Đán (mùng 5) [placeholder]"),
    (date(2026, 2, 21), "Tết Nguyên Đán (mùng 6) [placeholder]"),
    # Giỗ Tổ Hùng Vương — 10/3 âm lịch = estimated 26/4/2026 [placeholder]
    (date(2026, 4, 26), "Giỗ Tổ Hùng Vương (10/3 ÂL) [placeholder]"),
    (date(2026, 4, 30), "Giải Phóng Miền Nam"),
    (date(2026, 5, 1), "Quốc tế Lao động"),
    (date(2026, 9, 2), "Quốc khánh"),
    (date(2026, 9, 3), "Quốc khánh (nghỉ bù) [placeholder]"),
]


def seed_business_calendar(apps, schema_editor):
    """Forward migration: create default Vietnam Banking schedule with holidays."""
    WorkSchedule = apps.get_model("db", "WorkSchedule")
    Holiday = apps.get_model("db", "Holiday")
    DayOverride = apps.get_model("db", "DayOverride")

    schedule = WorkSchedule.objects.create(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        name="Vietnam Banking",
        # Mon=True, Tue=True, Wed=True, Thu=True, Fri=True, Sat=False, Sun=False
        week_pattern=[True, True, True, True, True, False, False],
        timezone="Asia/Ho_Chi_Minh",
        is_default=True,
        country_code="VN",
        workspace=None,
    )

    # Seed 2025 holidays
    Holiday.objects.bulk_create([
        Holiday(schedule=schedule, date=d, name=name)
        for d, name in VN_HOLIDAYS_2025
    ])

    # Seed 2026 holidays (placeholders — verify against MOLISA before year starts)
    Holiday.objects.bulk_create([
        Holiday(schedule=schedule, date=d, name=name)
        for d, name in VN_HOLIDAYS_2026
    ])

    # Seed 2025 swap-day overrides
    DayOverride.objects.bulk_create([
        DayOverride(
            schedule=schedule,
            date=ov["date"],
            type=ov["type"],
            reason=ov["reason"],
            swap_with_date=ov["swap_with_date"],
        )
        for ov in VN_OVERRIDES_2025
    ])


def reverse_seed_business_calendar(apps, schema_editor):
    """Reverse migration: remove seeded default schedule (cascades to holidays/overrides)."""
    WorkSchedule = apps.get_model("db", "WorkSchedule")
    WorkSchedule.objects.filter(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001")
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0166_business_calendar"),
    ]

    operations = [
        migrations.RunPython(
            seed_business_calendar,
            reverse_code=reverse_seed_business_calendar,
        ),
    ]
