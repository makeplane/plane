import json

from django_elasticsearch_dsl import Document, fields
from elasticsearch_dsl import analysis


class BaseDocument(Document):
    """
    Any customizations needed on the Document level,
    that're needed to be applied to all the indexes, should go here.
    """

    def get_queryset(self):
        """
        Customized get_queryset method that returns the queryset from objects manager,
        and apply any related models to the queryset.
        Return the queryset that should be indexed by this doc type.
        """
        qs = self.django.model.all_objects.all()
        return self.apply_related_to_queryset(qs)


class JsonKeywordField(fields.KeywordField):
    """
    A Custom field to store the simple json fields from the models into ES as strings.
    """

    _coerce = True

    def _deserialize(self, data):
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return {}

    def get_value_from_instance(self, instance, field_value_to_ignore=None):
        try:
            value = super().get_value_from_instance(instance, field_value_to_ignore)
            return json.dumps(value)
        except TypeError:
            return "{}"


lowercase_normalizer = analysis.normalizer("lowercase_normalizer", filter=["lowercase"])
