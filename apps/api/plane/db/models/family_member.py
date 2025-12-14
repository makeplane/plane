"""FamilyMember model for FamilyFlow - represents individual users within a family"""

# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# Module imports
from .base import BaseModel
from .family import Family, FamilyRole


class FamilyMember(BaseModel):
    """
    Represents an individual user within a family.
    
    Links a User (authentication) to a Family with family-specific attributes like role,
    age (for age-appropriate UI), and display name. Similar to WorkspaceMember in Plane.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="family_members",
        help_text="User account linked to this family member"
    )
    family = models.ForeignKey(
        "db.Family",
        on_delete=models.CASCADE,
        related_name="members",
        help_text="Family this member belongs to"
    )
    name = models.CharField(
        max_length=200,
        verbose_name="Display Name",
        help_text="Display name in family context (may differ from user's display name)"
    )
    age = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(120)],
        help_text="Age for age-appropriate UI (required for children, optional for adults)"
    )
    role = models.CharField(
        max_length=20,
        choices=FamilyRole.choices,
        default=FamilyRole.PARENT,
        help_text="Family role: parent or child"
    )
    avatar_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Profile picture URL"
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Joined At",
        help_text="When the member joined the family"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the member is currently active in the family"
    )
    use_kid_interface = models.BooleanField(
        default=None,
        null=True,
        blank=True,
        help_text="Override automatic kid interface assignment (null = auto based on age < 13)"
    )
    
    class Meta:
        verbose_name = "Family Member"
        verbose_name_plural = "Family Members"
        db_table = "family_members"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "family"],
                condition=models.Q(deleted_at__isnull=True),
                name="family_member_unique_user_family_when_deleted_at_null"
            )
        ]
        indexes = [
            models.Index(fields=["family", "is_active"]),
            models.Index(fields=["user", "is_active"]),
        ]
    
    def __str__(self) -> str:
        """Return member representation"""
        return f"{self.name} ({self.role}) <{self.family.name}>"
    
    def clean(self):
        """Validate model data"""
        from django.core.exceptions import ValidationError
        
        # Age is required if role is child
        if self.role == FamilyRole.CHILD and (self.age is None or self.age == 0):
            raise ValidationError({"age": "Age is required for child members"})
        
        # Validate age range
        if self.age is not None:
            if self.age < 0 or self.age > 120:
                raise ValidationError({"age": "Age must be between 0 and 120"})
    
    def should_use_kid_interface(self) -> bool:
        """
        Determine if member should use kid-friendly interface.
        
        Returns True if:
        - use_kid_interface is explicitly True, OR
        - use_kid_interface is None and age < 13
        """
        if self.use_kid_interface is not None:
            return self.use_kid_interface
        return self.age is not None and self.age < 13
    
    def save(self, *args, **kwargs):
        """Override save to validate age for children"""
        self.full_clean()
        super().save(*args, **kwargs)

