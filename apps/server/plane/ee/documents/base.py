# Standard library imports
import json

# Third-party imports
from django_opensearch_dsl import Document, fields
from django_opensearch_dsl.fields import DODField
from opensearchpy.helpers import analysis
from django.conf import settings

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
            "number_of_shards": settings.OPENSEARCH_SHARD_COUNT,
            "number_of_replicas": settings.OPENSEARCH_REPLICA_COUNT,
            # Text search performance optimizations during heavy indexing
            "refresh_interval": "30s",  # Reduce refresh frequency (default: 1s)
            # Indexing performance settings
            "index.translog.flush_threshold_size": "1gb",  # Larger translog before flush
            "index.translog.sync_interval": "30s",  # Less frequent syncing
            # Search performance during indexing
            "index.search.slowlog.threshold.query.warn": "1s",
            "index.search.slowlog.threshold.query.info": "500ms",
            "index.indexing.slowlog.threshold.index.warn": "5s",
            "index.indexing.slowlog.threshold.index.info": "2s",
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

    def _prepare_action(self, object_instance, action):
        """
        Override _prepare_action to set semantic field change defaults and handle upsert.

        If action is "update" (upsert equivalent) and _semantic_fields_changed
        is not already set, default to False to preserve existing embeddings.
        """
        # Set default for update actions (upsert equivalent) if not already set
        if action == "update" and not hasattr(
            object_instance, "_semantic_fields_changed"
        ):
            object_instance._semantic_fields_changed = False

        # Get the base action dictionary
        action_dict = super()._prepare_action(object_instance, action)

        # Add upsert behavior for update actions
        if action == "update":
            action_dict["doc_as_upsert"] = True

        return action_dict


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
