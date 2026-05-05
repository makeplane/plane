# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib.postgres.fields import ArrayField
from django.core.cache import cache
from django.db import models
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

# Module imports
from .base import BaseModel


class WorkSchedule(BaseModel):
    """
    Defines a work schedule (workweek pattern + timezone) for an instance or workspace.
    workspace=None means instance-level default (applies to all workspaces that lack own schedule).
    """

    workspace = models.ForeignKey(
        "Workspace",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="work_schedules",
        help_text="NULL = instance-level default; set to scope per workspace.",
    )
    name = models.CharField(max_length=100)
    # 7 booleans indexed [Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6]
    week_pattern = ArrayField(
        models.BooleanField(),
        size=7,
        default=list,
        help_text="Mon–Sun work flags. True = working day.",
    )
    timezone = models.CharField(max_length=64, default="Asia/Ho_Chi_Minh")
    is_default = models.BooleanField(default=False)
    country_code = models.CharField(max_length=2, default="VN")

    class Meta:
        db_table = "work_schedules"
        verbose_name = "Work Schedule"
        verbose_name_plural = "Work Schedules"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "is_default"],
                condition=models.Q(is_default=True),
                name="unique_default_schedule_per_workspace",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class Holiday(BaseModel):
    """A public holiday date linked to a WorkSchedule."""

    schedule = models.ForeignKey(
        WorkSchedule,
        on_delete=models.CASCADE,
        related_name="holidays",
    )
    date = models.DateField()
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "work_schedule_holidays"
        verbose_name = "Holiday"
        verbose_name_plural = "Holidays"
        unique_together = [("schedule", "date")]
        indexes = [
            models.Index(fields=["schedule", "date"], name="holiday_schedule_date_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.date})"


class DayOverride(BaseModel):
    """
    Override the default workweek/holiday decision for a specific date.
    type='WORKDAY' → forced working (e.g. MOLISA swap-day on a Saturday).
    type='HOLIDAY' → forced holiday (e.g. compensatory rest day on a weekday).
    """

    WORKDAY = "WORKDAY"
    HOLIDAY = "HOLIDAY"
    OVERRIDE_TYPE_CHOICES = [
        (WORKDAY, "Work day"),
        (HOLIDAY, "Holiday"),
    ]

    schedule = models.ForeignKey(
        WorkSchedule,
        on_delete=models.CASCADE,
        related_name="overrides",
    )
    date = models.DateField()
    type = models.CharField(max_length=10, choices=OVERRIDE_TYPE_CHOICES)
    reason = models.CharField(max_length=200, blank=True)
    swap_with_date = models.DateField(
        null=True,
        blank=True,
        help_text="Paired date in the swap arrangement — audit/display only.",
    )

    class Meta:
        db_table = "work_schedule_day_overrides"
        verbose_name = "Day Override"
        verbose_name_plural = "Day Overrides"
        unique_together = [("schedule", "date")]
        indexes = [
            models.Index(fields=["schedule", "date"], name="override_schedule_date_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.type} override on {self.date}"


# ---------------------------------------------------------------------------
# Signal handlers — invalidate Redis cache when holiday/override data changes
# ---------------------------------------------------------------------------

def _calendar_cache_key(schedule_id: object, year: int) -> str:
    return f"calendar:{schedule_id}:{year}"


def _extract_year(date_value: object) -> int:
    """Extract year from a date or ISO-string value (signal receives either form)."""
    if hasattr(date_value, "year"):
        return date_value.year
    # Fallback: parse YYYY-MM-DD string
    from datetime import date as _date
    return _date.fromisoformat(str(date_value)).year


@receiver([post_save, post_delete], sender=Holiday)
def invalidate_cache_on_holiday_change(
    sender: type, instance: Holiday, **kwargs: object
) -> None:
    """Delete calendar cache entry when a Holiday is created/updated/deleted."""
    cache.delete(_calendar_cache_key(instance.schedule_id, _extract_year(instance.date)))


@receiver([post_save, post_delete], sender=DayOverride)
def invalidate_cache_on_override_change(
    sender: type, instance: DayOverride, **kwargs: object
) -> None:
    """Delete calendar cache entry when a DayOverride is created/updated/deleted."""
    cache.delete(_calendar_cache_key(instance.schedule_id, _extract_year(instance.date)))


# Cache-key safe horizon for fallback iteration when delete_pattern is
# unavailable (LocMemCache / test backends). Plane standardises on
# django_redis in production, where delete_pattern is always callable and
# this fallback never runs. Constants are extracted so the "magic range"
# decision is documented and easy to widen without hunting inline literals.
CACHE_FALLBACK_MIN_YEAR = 2020
CACHE_FALLBACK_MAX_YEAR = 2100


def _clear_schedule_cache(schedule_id: object) -> None:
    """Remove all calendar cache entries for a schedule (all years).

    Uses delete_pattern (django_redis) when available — O(1) glob delete.
    Falls back to iterating CACHE_FALLBACK_MIN_YEAR..CACHE_FALLBACK_MAX_YEAR
    for test/LocMem backends only.
    """
    delete_pattern = getattr(cache, "delete_pattern", None)
    if callable(delete_pattern):
        delete_pattern(f"calendar:{schedule_id}:*")
    else:
        for year in range(CACHE_FALLBACK_MIN_YEAR, CACHE_FALLBACK_MAX_YEAR + 1):
            cache.delete(_calendar_cache_key(schedule_id, year))


@receiver(post_delete, sender=WorkSchedule)
def invalidate_cache_on_schedule_hard_delete(
    sender: type, instance: WorkSchedule, **kwargs: object
) -> None:
    """Handle hard-delete of a WorkSchedule (test / admin hard remove)."""
    _clear_schedule_cache(instance.id)


@receiver(post_save, sender=WorkSchedule)
def invalidate_cache_on_schedule_soft_delete(
    sender: type, instance: WorkSchedule, **kwargs: object
) -> None:
    """Handle soft-delete of a WorkSchedule (sets deleted_at via SoftDeleteModel).

    Plane uses soft delete by default — post_delete never fires on soft delete.
    We detect it by checking deleted_at being newly set.
    """
    if instance.deleted_at is not None:
        _clear_schedule_cache(instance.id)
