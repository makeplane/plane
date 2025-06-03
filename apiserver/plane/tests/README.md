# Plane Tests

This directory contains tests for the Plane application. The tests are organized using pytest.

## Test Structure

Tests are organized into the following categories:

- **Unit tests**: Test individual functions or classes in isolation.
- **Contract tests**: Test interactions between components and verify API contracts are fulfilled.
  - **API tests**: Test the external API endpoints (under `/api/v1/`).
  - **App tests**: Test the web application API endpoints (under `/api/`).
- **Smoke tests**: Basic tests to verify that the application runs correctly.

## Continuous Integration (CI)

Tests run automatically on pull requests via GitHub Actions:

### Automated Testing Workflow

When a pull request is created or updated with changes to `apiserver/**` files, the `test-pull-request.yml` workflow automatically:

1. **Sets up test environment**: PostgreSQL 14, Redis 7, Python 3.11
2. **Runs unit tests**: Fast, isolated component tests with coverage
3. **Runs contract tests**: API endpoint verification
4. **Generates coverage reports**: Enforces 90% threshold with HTML, terminal, and XML formats
5. **Uploads to Codecov**: If token is configured

### CI Environment Variables

The CI automatically configures comprehensive environment variables including:
- Database and Redis connections
- Security settings (disabled for testing)
- Base URLs for all components
- File upload and storage settings
- External service configurations (mocked)

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
   - Uses session-based authentication (CSRF disabled)
   - Designed for the web application frontend
   - Tests use the `session_client` fixture for authentication
   - Test files are in `contract/app/`

## Running Tests

### Local Testing

To run all tests:

```bash
python -m pytest
```

To run specific test categories:

```bash
# Run unit tests
python -m pytest plane/tests/unit/

# Run API contract tests
python -m pytest plane/tests/contract/api/

# Run App contract tests
python -m pytest plane/tests/contract/app/

# Run smoke tests
python -m pytest plane/tests/smoke/
```

### Using the Test Runner

For convenience, we provide helper scripts:

```bash
# Using Python script directly
python run_tests.py --coverage --verbose  # Full test suite with coverage
python run_tests.py -u -v                 # Unit tests only
python run_tests.py -c -v                 # Contract tests only
python run_tests.py -p -v                 # Parallel execution

# Using shell wrapper
./run_tests.sh --coverage --verbose       # Full test suite with coverage
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
3. Use the correct URL namespace when reverse-resolving URLs:
   - For external API, use `reverse("api:endpoint_name")`  
   - For web app API, use `reverse("endpoint_name")`
4. Add the `@pytest.mark.django_db` decorator to tests that interact with the database.
5. Add the appropriate markers (`@pytest.mark.contract`, etc.) to categorize tests.

## Test Fixtures

Common fixtures are defined in:

- `conftest.py`: General fixtures for authentication, database access, etc.
- `conftest_external.py`: Fixtures for external services (Redis, Elasticsearch, Celery, MongoDB)
- `factories.py`: Test factories for easy model instance creation

## Best Practices

When writing tests, follow these guidelines:

1. **Use pytest's assert syntax** instead of Django's `self.assert*` methods.
2. **Add markers to categorize tests**:
   ```python
   @pytest.mark.unit
   @pytest.mark.contract
   @pytest.mark.smoke
   ```
3. **Use fixtures instead of setUp/tearDown methods** for cleaner, more reusable test code.
4. **Mock external dependencies** with the provided fixtures to avoid external service dependencies.
5. **Write focused tests** that verify one specific behavior or edge case.
6. **Keep test files small and organized** by logical components or endpoints.
7. **Target 90% code coverage** for models, serializers, and business logic.

## External Dependencies

Tests for components that interact with external services should:

1. Use the `mock_redis`, `mock_elasticsearch`, `mock_mongodb`, and `mock_celery` fixtures for unit and most contract tests.
2. For more comprehensive contract tests, use Docker-based test containers (optional).

## Coverage Reports

Generate a coverage report with:

```bash
python -m pytest --cov=plane --cov-report=term --cov-report=html
# Or using the test runner
python run_tests.py --coverage
```

This creates an HTML report in the `htmlcov/` directory and enforces the 90% coverage threshold.

## CI Troubleshooting

### Common CI Issues

1. **Test failures**: Check the GitHub Actions logs for specific error messages
2. **Coverage below threshold**: Add tests for uncovered code
3. **Database connection issues**: Ensure PostgreSQL service is healthy in CI
4. **Redis connection issues**: Ensure Redis service is healthy in CI

### Local Setup for CI Testing

Make sure you have the test dependencies installed:

```bash
pip install -r requirements/test.txt
```

Set up your local environment with PostgreSQL and Redis, or use the provided Docker setup.

## Migration from Old Tests

Some tests are still in the old format in the `api/` directory. These need to be migrated to the new contract test structure in the appropriate directories. 