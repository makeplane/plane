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

import uuid

# Django imports
from django.db import models

# Third party imports
from crum import get_current_user

# Module imports
from ..mixins import AuditModel


class BaseModel(AuditModel):
    id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True)

    class Meta:
        abstract = True

    def save(self, *args, disable_auto_set_user=False, **kwargs):
        if not disable_auto_set_user:
            user = get_current_user()

            if user is not None and not user.is_anonymous:
                if self._state.adding:
                    # Only auto-set created_by if not already set on the instance
                    if self.created_by_id is None:
                        self.created_by_id = user.pk
                else:
                    # On update, track who made the change
                    self.updated_by_id = user.pk

        super(BaseModel, self).save(*args, **kwargs)

    def __str__(self):
        return str(self.id)




