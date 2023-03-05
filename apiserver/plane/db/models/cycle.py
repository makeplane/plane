# Django imports
from django.db import models
from django.conf import settings

# Module imports
from . import ProjectBaseModel


class Cycle(ProjectBaseModel):
    name = models.CharField(max_length=255, verbose_name="Cycle Name")
    description = models.TextField(verbose_name="Cycle Description", blank=True)
    start_date = models.DateField(verbose_name="Start Date", blank=True, null=True)
    end_date = models.DateField(verbose_name="End Date", blank=True, null=True)
    owned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_by_cycle",
    )

    class Meta:
        verbose_name = "Cycle"
        verbose_name_plural = "Cycles"
        db_table = "cycles"
        ordering = ("-created_at",)

    def __str__(self):
        """Return name of the cycle"""
        return f"{self.name} <{self.project.name}>"


class CycleIssue(ProjectBaseModel):
    """
    Cycle Issues
    """

    issue = models.OneToOneField(
        "db.Issue", on_delete=models.CASCADE, related_name="issue_cycle"
    )
    cycle = models.ForeignKey(
        Cycle, on_delete=models.CASCADE, related_name="issue_cycle"
    )

    class Meta:
        verbose_name = "Cycle Issue"
        verbose_name_plural = "Cycle Issues"
        db_table = "cycle_issues"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.cycle}"


class CycleFavorite(ProjectBaseModel):
    """_summary_
    CycleFavorite (model): To store all the cycle favorite of the user
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cycle_favorites",
    )
    cycle = models.ForeignKey(
        "db.Cycle", on_delete=models.CASCADE, related_name="cycle_favorites"
    )

    class Meta:
        unique_together = ["cycle", "user"]
        verbose_name = "Cycle Favorite"
        verbose_name_plural = "Cycle Favorites"
        db_table = "cycle_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user and the cycle"""
        return f"{self.user.email} <{self.cycle.name}>"
