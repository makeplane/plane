# Standard library imports
import json

# Third-party imports
from django_opensearch_dsl import Document, fields
from opensearchpy.helpers import analysis


lowercase_normalizer = analysis.normalizer("lowercase_normalizer", filter=["lowercase"])

edge_ngram_tokenizer = analysis.tokenizer(
    "edge_ngram_tokenizer",
    type="edge_ngram",
    min_gram=2,
    max_gram=15,
    token_chars=["letter", "digit"],
)

edge_ngram_analyzer = analysis.analyzer(
    "edge_ngram_analyzer", tokenizer=edge_ngram_tokenizer, filter=["lowercase"]
)


class BaseDocument(Document):
    """
    Any customizations needed on the Document level,
    that're needed to be applied to all the indexes, should go here.
    """

    class Index:
        settings = {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "normalizer": {
                    "lowercase_normalizer": lowercase_normalizer.get_definition()
                },
                "tokenizer": {
                    "edge_ngram_tokenizer": edge_ngram_tokenizer.get_definition()
                },
                "analyzer": {
                    "edge_ngram_analyzer": edge_ngram_analyzer.get_definition()
                },
            },
        }

    def get_queryset(self, filter_=None, exclude=None, count=None):
        """
        Customized get_queryset method that returns the queryset from objects manager,
        and apply any related models to the queryset.
        Return the queryset that should be indexed by this doc type.
        """
        qs = self.django.model.all_objects.all()
        if filter_:
            qs = qs.filter(filter_)
        if exclude:
            qs = qs.exclude(exclude)
        if count is not None:
            qs = qs[:count]
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
