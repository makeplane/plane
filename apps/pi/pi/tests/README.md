# Plane AI Tests

## Overview
Tests for Plane API method signature validation and compliance with the Plane SDK specifications.

## Prerequisites
```bash
conda activate plane-pi
pip install pytest-asyncio
```

## Running Tests

### Run All Tests
```bash
python -m pytest pi/tests/ -v
```

### Run API Method Signature Tests Only
```bash
python -m pytest pi/tests/services/test_plane_api_methods.py -v
```

### Run Specific Test Category
```bash
# Test Projects API methods
python -m pytest pi/tests/services/test_plane_api_methods.py::TestPlaneAPIMethods::test_projects_api_method_signatures -v

# Test Work Items API methods  
python -m pytest pi/tests/services/test_plane_api_methods.py::TestPlaneAPIMethods::test_workitems_api_method_signatures -v
```

## Test Categories

| Category | Methods | Purpose |
|----------|---------|---------|
| **Projects** | 4 methods | Project CRUD operations |
| **Work Items** | 4 methods | Issue management with optional parameters |
| **Cycles** | 10 methods | Sprint/cycle management with work item operations |
| **Labels** | 2 methods | Label management |
| **States** | 2 methods | State management |
| **Modules** | 8 methods | Module management with work item operations |
| **Assets** | 5 methods | Asset upload and management |
| **Users** | 1 method | User information |

## Expected Results
```
============================================ 10 passed in 0.37s ============================================
```

All tests validate that implemented API methods have signatures that **exactly match** the Plane SDK specifications.

## Key Validations
- ✅ Parameter names match SDK (pk vs project_id, slug vs workspace_slug)
- ✅ Parameter order matches SDK (especially States API)
- ✅ Request objects implemented correctly (10+ request object types)
- ✅ Optional parameters supported (expand, fields, order_by, cursor, etc.)
- ✅ All 35+ methods accessible and compliant

## Troubleshooting
If tests fail, ensure you're in the plane-pi conda environment and have the latest dependencies installed.
