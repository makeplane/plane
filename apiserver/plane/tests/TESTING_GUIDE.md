# Testing Guide for Plane

This guide explains how to write tests for Plane using our pytest-based testing strategy.

## Test Categories

We divide tests into three categories:

1. **Unit Tests**: Testing individual components in isolation.
2. **Contract Tests**: Testing API endpoints and verifying contracts between components.
3. **Smoke Tests**: Basic end-to-end tests for critical flows.

## Writing Unit Tests

Unit tests should be placed in the appropriate directory under `tests/unit/` depending on what you're testing:

- `tests/unit/models/` - For model tests
- `tests/unit/serializers/` - For serializer tests
- `tests/unit/utils/` - For utility function tests

### Example Unit Test:

```python
import pytest
from plane.api.serializers import MySerializer

@pytest.mark.unit
class TestMySerializer:
    def test_serializer_valid_data(self):
        # Create input data
        data = {"field1": "value1", "field2": 42}
        
        # Initialize the serializer
        serializer = MySerializer(data=data)
        
        # Validate
        assert serializer.is_valid()
        
        # Check validated data
        assert serializer.validated_data["field1"] == "value1"
        assert serializer.validated_data["field2"] == 42
```

## Writing Contract Tests

Contract tests should be placed in `tests/contract/api/` or `tests/contract/app/` directories and should test the API endpoints.

### Example Contract Test:

```python
import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.contract
class TestMyEndpoint:
    @pytest.mark.django_db
    def test_my_endpoint_get(self, auth_client):
        # Get the URL
        url = reverse("my-endpoint")
        
        # Make request
        response = auth_client.get(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        assert "data" in response.data
```

## Writing Smoke Tests

Smoke tests should be placed in `tests/smoke/` directory and use the `plane_server` fixture to test against a real HTTP server.

### Example Smoke Test:

```python
import pytest
import requests

@pytest.mark.smoke
class TestCriticalFlow:
    @pytest.mark.django_db
    def test_login_flow(self, plane_server, create_user, user_data):
        # Get login URL
        url = f"{plane_server.url}/api/auth/signin/"
        
        # Test login
        response = requests.post(
            url, 
            json={
                "email": user_data["email"],
                "password": user_data["password"]
            }
        )
        
        # Verify
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
```

## Useful Fixtures

Our test setup provides several useful fixtures:

1. `api_client`: An unauthenticated DRF APIClient
2. `api_key_client`: API client with API key authentication (for external API tests)
3. `session_client`: API client with session authentication (for web app API tests)
4. `create_user`: Creates and returns a test user
5. `mock_redis`: Mocks Redis interactions
6. `mock_elasticsearch`: Mocks Elasticsearch interactions
7. `mock_celery`: Mocks Celery task execution

## Using Factory Boy

For more complex test data setup, use the provided factories:

```python
from plane.tests.factories import UserFactory, WorkspaceFactory

# Create a user
user = UserFactory()

# Create a workspace with a specific owner
workspace = WorkspaceFactory(owner=user)

# Create multiple objects
users = UserFactory.create_batch(5)
```

## Running Tests

Use pytest to run tests:

```bash
# Run all tests
python -m pytest

# Run only unit tests with coverage
python -m pytest -m unit --cov=plane
```

## Best Practices

1. **Keep tests small and focused** - Each test should verify one specific behavior.
2. **Use markers** - Always add appropriate markers (`@pytest.mark.unit`, etc.).
3. **Mock external dependencies** - Use the provided mock fixtures.
4. **Use factories** - For complex data setup, use factories.
5. **Don't test the framework** - Focus on testing your business logic, not Django/DRF itself.
6. **Write readable assertions** - Use plain `assert` statements with clear messaging.
7. **Focus on coverage** - Aim for ≥90% code coverage for critical components.