# Testing Guide for Plane

This guide explains how to write tests for Plane using our pytest-based testing strategy.

## Test Categories

We divide tests into three categories:

1. **Unit Tests**: Testing individual components in isolation.
2. **Contract Tests**: Testing API endpoints and verifying contracts between components.
3. **Smoke Tests**: Basic end-to-end tests for critical flows.

## Writing Unit Tests

Unit tests should be placed in the appropriate directory under `plane/tests/unit/` depending on what you're testing:

- `plane/tests/unit/models/` - For model tests
- `plane/tests/unit/serializers/` - For serializer tests
- `plane/tests/unit/utils/` - For utility function tests
- `plane/tests/unit/views/`, `middleware/`, `bg_tasks/`, `db/`, `settings/`, `observability/` - For views, middleware, background tasks, database helpers, settings and observability

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

Contract tests should be placed in `plane/tests/contract/api/` (external API, `api_key_client`) or `plane/tests/contract/app/` (web app API, `session_client`) directories and should test the API endpoints.

### Example Contract Test:

```python
import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.contract
class TestMyEndpoint:
    @pytest.mark.django_db
    def test_my_endpoint_get(self, session_client):
        # Get the URL
        url = reverse("my-endpoint")

        # Make request
        response = session_client.get(url)

        # Check response
        assert response.status_code == status.HTTP_200_OK
        assert "data" in response.data
```

## Writing Smoke Tests

Smoke tests should be placed in `plane/tests/smoke/` directory and use the `plane_server` fixture to test against a real HTTP server.

### Example Smoke Test:

```python
import pytest
import requests
from django.urls import reverse

@pytest.mark.smoke
class TestCriticalFlow:
    @pytest.mark.django_db
    def test_login_flow(self, plane_server, create_user, user_data):
        # Sign-in is a form POST that answers with a redirect, not a token
        url = f"{plane_server.url}{reverse('sign-in')}"

        response = requests.post(
            url,
            data={"email": user_data["email"], "password": user_data["password"]},
            allow_redirects=False,
        )

        # Verify
        assert response.status_code not in range(400, 600)
```

## Useful Fixtures

Our test setup provides several useful fixtures:

1. `api_client`: An unauthenticated DRF APIClient
2. `api_key_client`: API client with API key authentication (for external API tests)
3. `session_client`: API client with session authentication (for web app API tests)
4. `create_user`: Creates and returns a test user (credentials in `user_data`)
5. `api_token`: API token for the test user
6. `plane_server`: Live Django test server for smoke tests
7. `workspace`: A workspace owned by the test user
8. `mock_redis`: Patches `plane.settings.redis.redis_instance` to return a `MagicMock` client
9. `mock_celery`: Patches Celery's `Task.delay` so tasks are not executed

For other external services, use pytest-mock's `mocker` fixture.

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

The recommended way is the isolated Docker stack described in [`apps/api/tests/RUNNING_TESTS.md`](../../tests/RUNNING_TESTS.md):

```bash
# From the repo root
docker compose -f docker-compose-test.yml run --rm --build api-tests pytest -m unit
```

With a local env (`uv sync` in `apps/api` plus running Postgres, Redis, RabbitMQ and MinIO):

```bash
# Run all tests
uv run pytest

# Run only unit tests with coverage
uv run pytest -m unit --cov=plane
```

## Best Practices

1. **Keep tests small and focused** - Each test should verify one specific behavior.
2. **Use markers** - Always add appropriate markers (`@pytest.mark.unit`, etc.).
3. **Mock external dependencies** - Use `mock_redis` / `mock_celery`, or `mocker.patch(...)` from pytest-mock.
4. **Use factories** - For complex data setup, use factories.
5. **Don't test the framework** - Focus on testing your business logic, not Django/DRF itself.
6. **Write readable assertions** - Use plain `assert` statements with clear messaging.
7. **Focus on coverage** - Aim for ≥90% code coverage for critical components.
