# State Permission Guards Testing - Quick Start

## Test Files Location

```
✓ Unit Tests:
  /Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/tests/unit/utils/test_instance_admin.py

✓ Contract Tests:
  /Users/ngoctran/Documents/Shinhan/plane/apps/api/plane/tests/contract/app/test_state_permissions.py
```

## Running Tests

### Option 1: Docker (Recommended)

```bash
cd /Users/ngoctran/Documents/Shinhan/plane

# Run all state permission tests
docker-compose exec api python -m pytest \
  plane/tests/unit/utils/test_instance_admin.py \
  plane/tests/contract/app/test_state_permissions.py -v

# Run with coverage
docker-compose exec api python -m pytest \
  plane/tests/unit/utils/test_instance_admin.py \
  plane/tests/contract/app/test_state_permissions.py \
  --cov=plane.utils.instance_admin \
  --cov=plane.app.views.state \
  -v
```

### Option 2: Using run_tests.py Script

```bash
cd /Users/ngoctran/Documents/Shinhan/plane/apps/api

# Run unit tests only
python run_tests.py -u -v

# Run contract tests only
python run_tests.py -c -v

# Run with coverage report
python run_tests.py -u -c -o -v
```

### Option 3: Direct pytest (requires proper environment)

```bash
cd /Users/ngoctran/Documents/Shinhan/plane/apps/api

# Run tests
python -m pytest plane/tests/unit/utils/test_instance_admin.py -v
python -m pytest plane/tests/contract/app/test_state_permissions.py -v
```

## Test Summary

| Category                    | Tests  | Status      |
| --------------------------- | ------ | ----------- |
| Unit: is_instance_admin()   | 6      | Created ✓   |
| Contract: Create operations | 2      | Created ✓   |
| Contract: Update operations | 3      | Created ✓   |
| Contract: Delete operations | 4      | Created ✓   |
| Contract: Mark as default   | 2      | Created ✓   |
| Contract: Instance admin    | 4      | Created ✓   |
| **TOTAL**                   | **21** | **✓ Ready** |

## Test Markers

All tests include proper markers:

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.contract` - Contract tests
- `@pytest.mark.django_db` - Database access

## What's Being Tested

1. **Permission Guards:**
   - ✓ Create: is_system field stripping for non-instance-admins
   - ✓ Update: System state modification blocking (except sequence)
   - ✓ Delete: System state deletion blocking
   - ✓ Mark as default: System state default blocking

2. **Edge Cases:**
   - ✓ Anonymous/None users
   - ✓ No Instance configured
   - ✓ Role boundary conditions (10, 15, 20)
   - ✓ Sequence-only patches (drag-reorder)
   - ✓ Default state deletion prevention
   - ✓ Non-empty state deletion prevention

3. **Instance Admin Capabilities:**
   - ✓ Can create system states
   - ✓ Can modify system states
   - ✓ Can delete system states
   - ✓ Can mark system states as default

## Expected Results

All tests should PASS (21/21):

- 0 failures
- 0 skipped
- ~100% coverage of permission guard logic

## Full Report

See: `/Users/ngoctran/Documents/Shinhan/plane/plans/reports/tester-260312-0947-state-permissions.md`
