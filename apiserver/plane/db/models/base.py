import uuid

# Django imports
from django.db import models

# Third party imports
from crum import get_current_user

# Module imports
from ..mixins import AuditModel


class BaseModel(AuditModel):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        primary_key=True,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        user = get_current_user()

        if user is None or user.is_anonymous:
            self.created_by = None
            self.updated_by = None
            super(BaseModel, self).save(*args, **kwargs)
        else:
            # Check if the model is being created or updated
            if self._state.adding:
                # If created only set created_by value: set updated_by to None
                self.created_by = user
                self.updated_by = None
            # If updated only set updated_by value don't touch created_by
            self.updated_by = user
            super(BaseModel, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.id)
