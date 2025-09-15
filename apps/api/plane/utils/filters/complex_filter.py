import json

from django.core.exceptions import ValidationError
from django.http import QueryDict
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters


class ComplexFilterBackend(filters.BaseFilterBackend):
    """
    Filter backend that supports complex JSON filtering.

    For full, up-to-date examples and usage, see the package README
    at `plane/utils/filters/README.md`.
    """

    filter_param = "filter"
    default_max_depth = 5

    def filter_queryset(self, request, queryset, view, filter_data=None):
        """Normalize filter input and apply JSON-based filtering.

        Accepts explicit `filter_data` (dict or JSON string) or reads the
        `filter` query parameter. Enforces JSON-only filtering.
        """
        try:
            if filter_data is not None:
                normalized = self._normalize_filter_data(filter_data, "filter_data")
                return self._apply_json_filter(queryset, normalized, view)

            filter_string = request.query_params.get(self.filter_param, None)
            if not filter_string:
                return queryset

            normalized = self._normalize_filter_data(filter_string, "filter")
            return self._apply_json_filter(queryset, normalized, view)
        except ValidationError:
            # Propagate validation errors unchanged
            raise
        except Exception as e:
            # Convert unexpected errors to ValidationError to keep response consistent
            raise ValidationError(f"Filter error: {str(e)}")

    def _normalize_filter_data(self, raw_filter, source_label):
        """Return a dict from raw filter input or raise a ValidationError.

        - raw_filter may be a dict or a JSON string
        - source_label is used in error messages (e.g., 'filter_data' or 'filter')
        """
        try:
            if isinstance(raw_filter, str):
                return json.loads(raw_filter)
            if isinstance(raw_filter, dict):
                return raw_filter
            raise ValidationError(f"'{source_label}' must be a dict or a JSON string.")
        except json.JSONDecodeError:
            raise ValidationError(
                f"Invalid JSON for '{source_label}'. Expected a valid JSON object."
            )

    def _apply_json_filter(self, queryset, filter_data, view):
        """Process a JSON filter structure using OR/AND/NOT set operations."""
        if not filter_data:
            return queryset

        # Validate structure and depth before field allowlist checks
        max_depth = self._get_max_depth(view)
        self._validate_structure(filter_data, max_depth=max_depth, current_depth=1)

        # Validate against the view's FilterSet (only declared filters are allowed)
        self._validate_fields(filter_data, view)

        # Build combined queryset using FilterSet-driven leaf evaluation
        combined_qs = self._evaluate_node(filter_data, queryset, view)
        if combined_qs is None:
            return queryset
        return combined_qs

    def _validate_fields(self, filter_data, view):
        """Validate that filtered fields are defined in the view's FilterSet."""
        filterset_class = getattr(view, "filterset_class", None)
        allowed_fields = (
            set(filterset_class.base_filters.keys()) if filterset_class else None
        )
        if not allowed_fields:
            # If no FilterSet is configured, reject filtering to avoid unintended exposure # noqa: E501
            raise ValidationError(
                "Filtering is not enabled for this endpoint (missing filterset_class)"
            )

        # Extract field names from the filter data
        fields = self._extract_field_names(filter_data)

        # Check if all fields are allowed
        for field in fields:
            # Field keys must match FilterSet filter names (including any lookups)
            # Example: 'sequence_id__gte' should be declared in base_filters
            # Special-case __range: require the '<base>__range' filter itself
            if field not in allowed_fields:
                raise ValidationError(f"Filtering on field '{field}' is not allowed")

    def _extract_field_names(self, filter_data):
        """Extract all field names from a nested filter structure"""
        if isinstance(filter_data, dict):
            fields = []
            for key, value in filter_data.items():
                if key.lower() in ("or", "and", "not"):
                    # This is a logical operator, process its children
                    if key.lower() == "not":
                        # 'not' has a dict as its value, not a list
                        if isinstance(value, dict):
                            fields.extend(self._extract_field_names(value))
                    else:
                        # 'or' and 'and' have lists as their values
                        for item in value:
                            fields.extend(self._extract_field_names(item))
                else:
                    # This is a field name
                    fields.append(key)
            return fields
        return []

    def _evaluate_node(self, node, base_queryset, view):
        """
        Recursively evaluate a JSON node into a combined queryset using set operations.

        Rules:
        - leaf dict → evaluated through DjangoFilterBackend as a mini-querystring
        - {"or": [...]} → union (|) of children
        - {"and": [...]} → intersection (&) of children
        - {"not": {...}} → exclude child's rows from the base queryset
          (complement within base scope)
        """
        if not isinstance(node, dict):
            return None

        # 'or' combination
        if "or" in node:
            children = node["or"]
            if not isinstance(children, list) or not children:
                return None
            combined = None
            for child in children:
                child_qs = self._evaluate_node(child, base_queryset, view)
                if child_qs is None:
                    continue
                combined = child_qs if combined is None else (combined | child_qs)
            return combined

        # 'and' combination
        if "and" in node:
            children = node["and"]
            if not isinstance(children, list) or not children:
                return None
            combined = None
            for child in children:
                child_qs = self._evaluate_node(child, base_queryset, view)
                if child_qs is None:
                    continue
                combined = child_qs if combined is None else (combined & child_qs)
            return combined

        # 'not' negation
        if "not" in node:
            child = node["not"]
            if not isinstance(child, dict):
                return None
            child_qs = self._evaluate_node(child, base_queryset, view)
            if child_qs is None:
                return None
            # Use subquery instead of pk__in for better performance
            # This avoids evaluating child_qs and creating large IN clauses
            return base_queryset.exclude(pk__in=child_qs.values("pk"))

        # Leaf dict: evaluate via DjangoFilterBackend using FilterSet
        return self._filter_leaf_via_backend(node, base_queryset, view)

    def _filter_leaf_via_backend(self, leaf_conditions, base_queryset, view):
        """Evaluate a leaf dict by delegating to DjangoFilterBackend once.

        We serialize the leaf dict into a mini querystring and let the view's
        filterset_class perform validation, conversion, and filtering. This returns
        a lazy queryset suitable for set-operations with siblings.
        """
        if not leaf_conditions:
            return None

        # Build a QueryDict from the leaf conditions
        qd = QueryDict(mutable=True)
        for key, value in leaf_conditions.items():
            # Special validation for __range to ensure two values
            if key.endswith("__range"):
                if not isinstance(value, (list, tuple)) or len(value) != 2:
                    raise ValidationError(
                        f"Range lookup for '{key}' needs exactly 2 values; got: {value}"
                    )
                # Pass as two values under the same key (works for RangeFilter)
                qd.setlist(key, [str(value[0]), str(value[1])])
                continue

            # Default serialization to string; QueryDict expects strings
            if isinstance(value, list):
                # Repeat key for list values (e.g., __in)
                qd.setlist(key, [str(v) for v in value])
            else:
                qd[key] = "" if value is None else str(value)

        qd = qd.copy()
        qd._mutable = False

        # Temporarily patch request.GET and delegate to DjangoFilterBackend
        backend = DjangoFilterBackend()
        request = view.request
        original_get = request._request.GET if hasattr(request, "_request") else None
        try:
            if hasattr(request, "_request"):
                request._request.GET = qd
            return backend.filter_queryset(request, base_queryset, view)
        finally:
            if hasattr(request, "_request") and original_get is not None:
                request._request.GET = original_get

    def _get_max_depth(self, view):
        """Return the maximum allowed nesting depth for complex filters.

        Falls back to class default if the view does not specify it or has
        an invalid value.
        """
        value = getattr(view, "complex_filter_max_depth", self.default_max_depth)
        try:
            value_int = int(value)
            if value_int <= 0:
                return self.default_max_depth
            return value_int
        except Exception:
            return self.default_max_depth

    def _validate_structure(self, node, max_depth, current_depth):
        """Validate JSON structure and enforce nesting depth.

        Rules:
        - Each object may contain only one logical operator:
          or/and/not (case-insensitive)
        - Logical operator objects cannot contain field keys alongside the
          operator
        - or/and values must be non-empty lists of dicts
        - not value must be a dict
        - Leaf objects must only contain field keys and acceptable values
        - Depth must not exceed max_depth
        """
        if current_depth > max_depth:
            raise ValidationError(
                f"Filter nesting is too deep (max {max_depth}); found depth"
                f" {current_depth}"
            )

        if not isinstance(node, dict):
            raise ValidationError("Each filter node must be a JSON object")

        if not node:
            raise ValidationError("Filter objects must not be empty")

        logical_keys = [
            k
            for k in node.keys()
            if isinstance(k, str) and k.lower() in ("or", "and", "not")
        ]

        if len(logical_keys) > 1:
            raise ValidationError(
                "A filter object cannot contain multiple logical operators at"
                " the same level"
            )

        if len(logical_keys) == 1:
            op_key = logical_keys[0]
            # must not mix operator with other keys
            if len(node) != 1:
                raise ValidationError(
                    f"Cannot mix logical operator '{op_key}' with field keys at"
                    f" the same level"
                )

            op = op_key.lower()
            value = node[op_key]

            if op in ("or", "and"):
                if not isinstance(value, list) or len(value) == 0:
                    raise ValidationError(
                        f"'{op}' must be a non-empty list of filter objects"
                    )
                for child in value:
                    if not isinstance(child, dict):
                        raise ValidationError(
                            f"All children of '{op}' must be JSON objects"
                        )
                    self._validate_structure(
                        child,
                        max_depth=max_depth,
                        current_depth=current_depth + 1,
                    )
                return

            if op == "not":
                if not isinstance(value, dict):
                    raise ValidationError("'not' must be a single JSON object")
                self._validate_structure(
                    value, max_depth=max_depth, current_depth=current_depth + 1
                )
                return

        # Leaf node: validate fields and values
        self._validate_leaf(node)

    def _validate_leaf(self, leaf):
        """Validate a leaf dict containing field lookups and values."""
        if not isinstance(leaf, dict) or not leaf:
            raise ValidationError("Leaf filter must be a non-empty JSON object")

        for key, value in leaf.items():
            if isinstance(key, str) and key.lower() in ("or", "and", "not"):
                raise ValidationError(
                    "Logical operators cannot appear in a leaf filter object"
                )

            # __range special case: must be sequence of exactly two scalars
            if isinstance(key, str) and key.endswith("__range"):
                if not isinstance(value, (list, tuple)) or len(value) != 2:
                    raise ValidationError(
                        f"Range lookup for '{key}' needs exactly 2 values; got: {value}"
                    )
                if not (self._is_scalar(value[0]) and self._is_scalar(value[1])):
                    raise ValidationError(f"Values for '{key}' must be scalar types")
                continue

            # Lists/Tuples must contain only scalar values
            if isinstance(value, (list, tuple)):
                if len(value) == 0:
                    raise ValidationError(f"List value for '{key}' must not be empty")
                for item in value:
                    if not self._is_scalar(item):
                        raise ValidationError(
                            f"List value for '{key}' must contain only scalar items"
                        )
                continue

            # Scalars and None are allowed
            if not self._is_scalar(value):
                raise ValidationError(
                    f"Value for '{key}' must be a scalar, null, or list/tuple of"
                    f" scalars"
                )

    def _is_scalar(self, value):
        return value is None or isinstance(value, (str, int, float, bool))
