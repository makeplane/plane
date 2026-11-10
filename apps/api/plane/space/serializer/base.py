# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    id = serializers.PrimaryKeyRelatedField(read_only=True)


class DynamicBaseSerializer(BaseSerializer):
    def __init__(self, *args, **kwargs):
        # 'fields' is a custom argument; pop it so it is not passed to the superclass.
        fields = kwargs.pop("fields", None)

        super().__init__(*args, **kwargs)

        # 'fields' restricts the OUTPUT only (see _readable_fields) so validation and saving
        # still see every writable field. Names may be strings or dicts (the key is used);
        # nested filtering is not supported. Unknown names are ignored, never expanded.
        self._output_fields = None
        if fields is not None:
            self._output_fields = {
                name for item in fields for name in ([item] if isinstance(item, str) else item.keys())
            }

    @property
    def _readable_fields(self):
        # DRF's output-only field iterator (writes use self.fields).
        for field in super()._readable_fields:
            if self._output_fields is None or field.field_name in self._output_fields:
                yield field
