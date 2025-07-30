"""
Unit tests for ReadReplicaRoutingMiddleware.
This module contains comprehensive tests for the ReadReplicaRoutingMiddleware
that handles intelligent database routing to read replicas based on HTTP methods
and view configuration.
Test Organization:
- TestReadReplicaRoutingMiddleware: Core middleware functionality
- TestProcessView: process_view method behavior
- TestReplicaDecisionLogic: Decision logic for replica usage
- TestAttributeDetection: View attribute detection methods
- TestExceptionHandling: Exception handling and cleanup
- TestRealViewIntegration: Real Django/DRF view integration
- TestEdgeCases: Edge cases and error conditions
"""

import pytest
from unittest.mock import Mock, patch

from django.http import HttpResponse
from django.test import RequestFactory
from django.views import View
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from plane.middleware.db_routing import ReadReplicaRoutingMiddleware


# Pytest fixtures
@pytest.fixture
def mock_get_response():
    """Fixture for mocked get_response callable."""
    return Mock(return_value=HttpResponse())


@pytest.fixture
def middleware(mock_get_response):
    """Fixture for ReadReplicaRoutingMiddleware instance."""
    return ReadReplicaRoutingMiddleware(mock_get_response)


@pytest.fixture
def request_factory():
    """Fixture for Django RequestFactory."""
    return RequestFactory()


@pytest.fixture
def mock_view_func():
    """Fixture for a basic mocked view function."""
    view = Mock()
    view.use_read_replica = True
    return view


@pytest.fixture
def get_request(request_factory):
    """Fixture for a GET request."""
    return request_factory.get("/api/test/")


@pytest.fixture
def post_request(request_factory):
    """Fixture for a POST request."""
    return request_factory.post("/api/test/")


@pytest.mark.unit
class TestReadReplicaRoutingMiddleware:
    """Test cases for ReadReplicaRoutingMiddleware core functionality."""

    def test_middleware_initialization(self, middleware, mock_get_response):
        """Test middleware initializes correctly with expected attributes."""
        assert middleware.get_response == mock_get_response
        assert hasattr(middleware, "READ_ONLY_METHODS")
        assert "GET" in middleware.READ_ONLY_METHODS
        assert "HEAD" in middleware.READ_ONLY_METHODS
        assert "OPTIONS" in middleware.READ_ONLY_METHODS

    def test_read_only_methods_constant(self, middleware):
        """Test READ_ONLY_METHODS contains expected HTTP methods."""
        expected_methods = {"GET", "HEAD", "OPTIONS"}
        assert middleware.READ_ONLY_METHODS == expected_methods

    @patch("plane.middleware.db_routing.set_use_read_replica")
    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_call_routes_write_methods_to_primary(
        self, mock_clear, mock_set, middleware, post_request, mock_get_response
    ):
        """Test __call__ routes write methods to primary database."""
        response = middleware(post_request)

        mock_set.assert_called_once_with(False)  # Primary database
        mock_clear.assert_called_once()
        assert response == mock_get_response.return_value

    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_call_with_read_methods_waits_for_process_view(
        self, mock_clear, middleware, get_request, mock_get_response
    ):
        """Test __call__ with read methods waits for process_view."""
        response = middleware(get_request)

        mock_clear.assert_called_once()
        assert response == mock_get_response.return_value

    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_call_always_cleans_up_context(self, mock_clear, middleware, get_request):
        """Test __call__ always cleans up context."""
        middleware(get_request)

        mock_clear.assert_called_once()

    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_call_cleans_up_context_on_exception(
        self, mock_clear, middleware, get_request, mock_get_response
    ):
        """Test __call__ cleans up context even if get_response raises."""
        mock_get_response.side_effect = Exception("Test exception")

        with pytest.raises(Exception, match="Test exception"):
            middleware(get_request)

        mock_clear.assert_called_once()


@pytest.mark.unit
class TestProcessView:
    """Test cases for process_view method functionality."""

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_read_method_and_replica_true(self, mock_set, middleware, get_request):
        """Test process_view with GET request and use_read_replica=True."""
        view_func = Mock()
        view_func.use_read_replica = True

        result = middleware.process_view(get_request, view_func, (), {})

        mock_set.assert_called_once_with(True)
        assert result is None

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_read_method_and_replica_false(
        self, mock_set, middleware, get_request
    ):
        """Test process_view with GET request and use_read_replica=False."""
        view_func = Mock()
        view_func.use_read_replica = False

        result = middleware.process_view(get_request, view_func, (), {})

        mock_set.assert_called_once_with(False)
        assert result is None

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_read_method_and_no_replica_attribute(
        self, mock_set, middleware, get_request
    ):
        """Test process_view with GET request and no use_read_replica attr."""
        view_func = Mock(spec=[])  # No use_read_replica attribute

        result = middleware.process_view(get_request, view_func, (), {})

        mock_set.assert_called_once_with(False)  # Default to primary
        assert result is None

    def test_with_write_method_ignores_view_attributes(self, middleware, post_request):
        """Test process_view with write methods ignores view attributes."""
        view_func = Mock()
        view_func.use_read_replica = True  # This should be ignored for POST

        result = middleware.process_view(post_request, view_func, (), {})

        assert result is None  # Should not process for write methods


@pytest.mark.unit
class TestReplicaDecisionLogic:
    """Test cases for replica decision logic methods."""

    def test_should_use_read_replica_with_true_attribute(self, middleware):
        """Test _should_use_read_replica returns True for True attribute."""
        view_func = Mock()
        view_func.use_read_replica = True

        result = middleware._should_use_read_replica(view_func)

        assert result is True

    def test_should_use_read_replica_with_false_attribute(self, middleware):
        """Test _should_use_read_replica returns False for False attribute."""
        view_func = Mock()
        view_func.use_read_replica = False

        result = middleware._should_use_read_replica(view_func)

        assert result is False

    def test_should_use_read_replica_with_no_attribute_defaults_false(self, middleware):
        """Test _should_use_read_replica defaults to False for missing attr."""
        view_func = Mock(spec=[])  # No use_read_replica attribute

        result = middleware._should_use_read_replica(view_func)

        assert result is False


@pytest.mark.unit
class TestAttributeDetection:
    """Test cases for view attribute detection methods."""

    def test_get_use_replica_attribute_function_based_view(self, middleware):
        """Test _get_use_replica_attribute with function-based view."""
        # Test with True
        view_func = Mock()
        view_func.use_read_replica = True
        result = middleware._get_use_replica_attribute(view_func)
        assert result is True

        # Test with False
        view_func.use_read_replica = False
        result = middleware._get_use_replica_attribute(view_func)
        assert result is False

        # Test with no attribute
        view_func = Mock(spec=[])
        result = middleware._get_use_replica_attribute(view_func)
        assert result is None

    def test_get_use_replica_attribute_django_cbv(self, middleware):
        """Test _get_use_replica_attribute with Django CBV wrapper."""
        view_class = Mock()
        view_class.use_read_replica = True
        view_func = Mock()
        view_func.view_class = view_class
        # Remove use_read_replica from view_func to ensure it checks view_class
        del view_func.use_read_replica

        result = middleware._get_use_replica_attribute(view_func)

        assert result is True

    def test_get_use_replica_attribute_drf_wrapper(self, middleware):
        """Test _get_use_replica_attribute with DRF wrapper."""

        # Create a real object to avoid Mock issues
        class ViewClass:
            use_read_replica = True

        class ViewFunc:
            cls = ViewClass()

        view_func = ViewFunc()

        result = middleware._get_use_replica_attribute(view_func)

        assert result is True

    def test_get_use_replica_attribute_priority_order(self, middleware):
        """Test attribute priority: direct > view_class > cls."""
        view_func = Mock()
        view_func.use_read_replica = True  # Direct attribute (highest priority)

        # Add conflicting attributes with lower priority
        view_class = Mock()
        view_class.use_read_replica = False
        view_func.view_class = view_class

        cls = Mock()
        cls.use_read_replica = False
        view_func.cls = cls

        result = middleware._get_use_replica_attribute(view_func)

        assert result is True  # Should use direct attribute

    @pytest.mark.parametrize(
        "value,expected",
        [
            (True, True),
            (False, False),
            (1, True),
            (0, False),
            ("yes", True),
            ("", False),
            ([], False),
            ([1], True),
            (None, False),
        ],
    )
    def test_should_use_read_replica_truthy_falsy_values(
        self, middleware, value, expected
    ):
        """Test _should_use_read_replica with various truthy/falsy values."""

        # Create a real object to test the attribute handling
        class TestView:
            pass

        view_func = TestView()
        view_func.use_read_replica = value

        result = middleware._should_use_read_replica(view_func)

        assert result == expected


@pytest.mark.unit
class TestExceptionHandling:
    """Test cases for exception handling and cleanup."""

    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_process_exception_cleans_up_context(
        self, mock_clear, middleware, request_factory
    ):
        """Test process_exception cleans up context."""
        request = request_factory.get("/api/test/")
        exception = Exception("Test exception")

        result = middleware.process_exception(request, exception)

        mock_clear.assert_called_once()
        assert result is None  # Don't handle the exception

    @patch("plane.middleware.db_routing.set_use_read_replica")
    @patch("plane.middleware.db_routing.clear_read_replica_context")
    def test_integration_full_request_cycle(
        self, mock_clear, mock_set, middleware, request_factory, mock_get_response
    ):
        """Test complete request cycle from __call__ through process_view."""
        request = request_factory.get("/api/test/")
        view_func = Mock()
        view_func.use_read_replica = True

        # Call middleware and process_view manually
        response = middleware(request)
        middleware.process_view(request, view_func, (), {})

        mock_set.assert_called_once_with(True)
        mock_clear.assert_called_once()
        assert response == mock_get_response.return_value


@pytest.mark.unit
class TestRealViewIntegration:
    """Test middleware with real Django/DRF view classes."""

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_django_class_based_view(self, mock_set, middleware, request_factory):
        """Test middleware with actual Django CBV."""

        class TestView(View):
            use_read_replica = True

        # Simulate Django's URL resolver creating a view wrapper
        view_func = TestView.as_view()
        request = request_factory.get("/api/test/")

        middleware.process_view(request, view_func, (), {})

        mock_set.assert_called_once_with(True)

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_drf_api_view(self, mock_set, middleware, request_factory):
        """Test middleware with DRF APIView."""

        class TestAPIView(APIView):
            use_read_replica = True

        # Simulate DRF's URL pattern creating a view wrapper
        view_func = TestAPIView.as_view()
        request = request_factory.get("/api/test/")

        middleware.process_view(request, view_func, (), {})

        mock_set.assert_called_once_with(True)

    @patch("plane.middleware.db_routing.set_use_read_replica")
    def test_with_drf_viewset(self, mock_set, middleware, request_factory):
        """Test middleware with DRF ViewSet."""

        class TestViewSet(ViewSet):
            use_read_replica = True

        # Simulate DRF router creating viewset action
        view_func = TestViewSet.as_view({"get": "list"})
        request = request_factory.get("/api/test/")

        middleware.process_view(request, view_func, (), {})

        mock_set.assert_called_once_with(True)


@pytest.mark.unit
class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_process_view_with_none_view_func(self, middleware, request_factory):
        """Test process_view handles None view_func gracefully."""
        request = request_factory.get("/api/test/")

        result = middleware.process_view(request, None, (), {})

        assert result is None  # Should not crash

    def test_get_use_replica_attribute_with_attribute_error(self, middleware):
        """Test _get_use_replica_attribute with view that raises AttributeError."""

        # Create a view class that raises AttributeError on access
        class ProblematicView:
            def __getattr__(self, name):
                if name == "use_read_replica":
                    raise AttributeError("Simulated attribute error")
                raise AttributeError(
                    f"'{type(self).__name__}' object has no attribute '{name}'"
                )

        view_func = ProblematicView()

        result = middleware._get_use_replica_attribute(view_func)

        assert result is None  # Should handle gracefully

    def test_multiple_exception_calls_are_safe(self, middleware, request_factory):
        """Test that multiple calls to process_exception don't cause issues."""
        request = request_factory.get("/api/test/")
        exception = Exception("Test exception")

        # Call multiple times
        result1 = middleware.process_exception(request, exception)
        result2 = middleware.process_exception(request, exception)

        assert result1 is None  # Both should return None safely
        assert result2 is None
