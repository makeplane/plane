# Plane Tests

This directory contains tests for the Plane application. The tests are organized using pytest.

## Test Structure

Tests are organized into the following categories:

- **Unit tests** (`unit/`): Test individual functions or classes in isolation. Grouped by area: `bg_tasks`, `db`, `middleware`, `models`, `observability`, `serializers`, `settings`, `utils`, `views`.
- **Contract tests**: Test interactions between components and verify API contracts are fulfilled.
  - **API tests**: Test the external API endpoints (under `/api/v1/`).
  - **App tests**: Test the web application API endpoints (under `/api/`).
- **Smoke tests**: Basic tests to verify that the application runs correctly.

## API vs App Endpoints

Plane has two types of API endpoints:

1. **External API** (`plane.api`):
   - Available at `/api/v1/` endpoint
   - Uses API key authentication (X-Api-Key header)
   - Designed for external API contracts and third-party access
   - Tests use the `api_key_client` fixture for authentication
   - Test files are in `contract/api/`

2. **Web App API** (`plane.app`):
   - Available at `/api/` endpoint
   - Uses session-based authentication with CSRF checks (`plane/authentication/session.py`)
   - Designed for the web application frontend
   - Tests use the `session_client` fixture, which calls `force_authenticate` for the test user
   - Test files are in `contract/app/`

## Running Tests

The easiest way is the isolated Docker stack; see [`apps/api/tests/RUNNING_TESTS.md`](../../tests/RUNNING_TESTS.md). The commands below run pytest directly and need a local env: from `apps/api`, run `uv sync`, then start Postgres, Redis, RabbitMQ and MinIO (for example with `docker-compose-local.yml`).

To run all tests:

```bash
uv run pytest
```

To run specific test categories:

```bash
# Run unit tests
uv run pytest plane/tests/unit/

# Run API contract tests
uv run pytest plane/tests/contract/api/

# Run App contract tests
uv run pytest plane/tests/contract/app/

# Run smoke tests
uv run pytest plane/tests/smoke/
```

For convenience, we also provide a helper script (`apps/api/run_tests.py`):

```bash
# Run all tests
uv run python run_tests.py

# Run only unit tests
uv run python run_tests.py -u

# Run contract tests with coverage report
uv run python run_tests.py -c -o

# Run tests in parallel
uv run python run_tests.py -p
```

## Fixtures

The following fixtures are available for testing:

- `api_client`: Unauthenticated API client
- `create_user`: Creates a test user
- `api_token`: API token for the test user
- `api_key_client`: API client with API key authentication (for external API tests)
- `session_client`: API client with session authentication (for app API tests)
- `plane_server`: Live Django test server for HTTP-based smoke tests

## Writing Tests

When writing tests, follow these guidelines:

1. Place tests in the appropriate directory based on their type.
2. Use the correct client fixture based on the API being tested:
   - For external API (`/api/v1/`), use `api_key_client`
   - For web app API (`/api/`), use `session_client`
   - For smoke tests with real HTTP, use `plane_server`
3. Reverse-resolve URLs by their plain name, e.g. `reverse("sign-in")` or `reverse("api-tokens")`; the URL confs do not use namespaces.
4. Add the `@pytest.mark.django_db` decorator to tests that interact with the database.
5. Add the appropriate markers (`@pytest.mark.contract`, etc.) to categorize tests.

## Test Fixtures

Common fixtures are defined in:

- `conftest.py`: General fixtures for authentication, database access, etc.
- `conftest_external.py`: `mock_redis` and `mock_celery` fixtures for external services. They are imported into `conftest.py`, which is what makes pytest pick them up; import any new fixture you add there the same way.
- `factories.py`: Test factories for easy model instance creation

## Best Practices

When writing tests, follow these guidelines:

1. **Use pytest's assert syntax** instead of Django's `self.assert*` methods.
2. **Add markers to categorize tests**:
   ```python
   @pytest.mark.unit
   @pytest.mark.contract
   @pytest.mark.smoke
   @pytest.mark.slow  # slow tests that can be skipped with -m "not slow"
   ```
3. **Use fixtures instead of setUp/tearDown methods** for cleaner, more reusable test code.
4. **Mock external dependencies** with the `mock_redis` / `mock_celery` fixtures, or pytest-mock's `mocker` fixture for anything else, to avoid external service dependencies.
5. **Write focused tests** that verify one specific behavior or edge case.
6. **Keep test files small and organized** by logical components or endpoints.
7. **Target 90% code coverage** for models, serializers, and business logic.

## External Dependencies

Tests for components that interact with external services should:

1. Use the `mock_redis` and `mock_celery` fixtures for unit and most contract tests, and `mocker.patch(...)` for other services.
2. For more comprehensive tests, use the Docker test stack in [`RUNNING_TESTS.md`](../../tests/RUNNING_TESTS.md), which runs real Postgres, Redis, RabbitMQ and MinIO.

## Coverage Reports

Generate a coverage report with:

```bash
uv run pytest --cov=plane --cov-report=term --cov-report=html
```

This creates an HTML report in the `htmlcov/` directory.
