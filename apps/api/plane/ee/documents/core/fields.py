"""
Custom OpenSearch field types and analyzers.

This module contains custom field definitions and text analysis components
that are used across OpenSearch documents.
"""

# Standard library imports
import json

# Third-party imports
from django_opensearch_dsl import fields
from django_opensearch_dsl.fields import DODField
from opensearchpy.helpers import analysis

# Text analysis components
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


class KnnVectorField(DODField):
    """
    A custom field for KNN vector data type in OpenSearch.
    This field allows for vector similarity search using k-NN algorithms.
    """

    name = "knn_vector"
