# Issue API Documentation

## Authentication

Authentication is performed using an API key.

- Include your API key in the `X-Api-Key` header with each request.
  *(Example: `X-Api-Key: YOUR_API_KEY`)*

- Optionally, if you need to assume a specific user role (e.g., when using a static API token), you can provide the username in the `X-Assume-Role` header.
  *(Example: `X-Assume-Role: username`)*

*(Note: If `X-Assume-Role` is provided with a static API token, the system will attempt to perform actions as the specified user. If not provided with a static token, it defaults to the first superuser found.)*

## Common Error Codes

The following are common HTTP status codes you might encounter:

- **200 OK**: Request was successful.
- **201 Created**: Resource was successfully created.
- **400 Bad Request**: The request was malformed or invalid. Check the response body for specific error messages.
- **401 Unauthorized**: Authentication credentials were not provided or are invalid.
- **403 Forbidden**: You do not have permission to access this resource.
- **404 Not Found**: The requested resource could not be found.
- **500 Internal Server Error**: An unexpected error occurred on the server.

### Error Response Structure

When an API request results in an error (typically with 4xx or 5xx status codes), the response body will usually be a JSON object containing details about the error. Common structures include:

**For general errors (e.g., 401, 403, 404, 500):**

```json
{
  "detail": "Specific error message explaining what went wrong."
}
```

**For validation errors (typically with a 400 Bad Request):**

The response will contain a JSON object where keys are the field names that failed validation, and values are arrays of strings describing the errors for that field.

```json
{
  "field_name_1": [
    "Error message for field_name_1."
  ],
  "field_name_2": [
    "Another error for field_name_2."
  ],
  "non_field_errors": [
    "Error message not specific to a particular field."
  ]
}
```

## Create Issue API

**Endpoint:**

```text
POST /api/v1/workspaces/{slug}/projects/{project_id}/issues/
```

### Request Body

You can provide the following fields (all are optional unless otherwise specified):

| Field                  | Type      | Description                                                                 |
|------------------------|-----------|-----------------------------------------------------------------------------|
| name                   | string    | Issue name (required)                                                       |
| state_id               | UUID      | State of the issue                                                          |
| priority               | string    | One of: urgent, high, medium, low, none                                     |
| start_date             | date      | Start date (YYYY-MM-DD)                                                     |
| target_date            | date      | Target date (YYYY-MM-DD)                                                    |
| assignees              | [UUID]    | List of user IDs to assign                                                  |
| labels                 | [UUID]    | List of label IDs                                                           |
| type_id                | UUID      | Issue type ID                                                               |
| parent                 | UUID      | Parent issue ID                                                             |
| hub_code               | string    | Hub code                                                                    |
| vendor_code            | string    | Vendor code                                                                 |
| customer_code          | string    | Customer code                                                               |
| worker_code            | string    | Worker code                                                                 |
| reference_number       | string    | Reference number                                                            |
| trip_reference_number  | string    | Trip reference number                                                       |
| hub_name               | string    | Hub name                                                                    |
| customer_name          | string    | Customer name                                                               |
| vendor_name            | string    | Vendor name                                                                 |
| worker_name            | string    | Worker name                                                                 |
| source                 | string    | Source                                                                      |
| external_source        | string    | External source identifier                                                  |
| external_id            | string    | External ID                                                                 |
| custom_properties      | array     | List of custom property objects (see below)                                 |
| created_by             | string/UUID | Creator's username or UUID (optional, defaults to current user)            |

#### Custom Property Object

Each object in `custom_properties` can have:

- `key`: string (required)
- `value`: string/int/bool/date (required)
- `data_type`: string (`string`, `number`, `boolean`, `date`)
- `issue_type_custom_property`: UUID (required)

### Example Request

```json
{
  "name": "Deliver package to hub",
  "priority": "high",
  "hub_code": "HUB123",
  "vendor_code": "VEND456",
  "customer_code": "CUST789",
  "worker_code": "WORK001",
  "reference_number": "REF-2024-001",
  "trip_reference_number": "TRIP-2024-001",
  "hub_name": "Main Hub",
  "customer_name": "Acme Corp",
  "vendor_name": "VendorX",
  "worker_name": "John Doe",
  "assignees": ["uuid1", "uuid2"],
  "labels": ["label-uuid"],
  "type_id": "type-uuid",
  "state_id": "state-uuid",
  "start_date": "2024-06-01",
  "target_date": "2024-06-10",
  "custom_properties": [
    {
      "key": "weight",
      "value": "10",
      "data_type": "number",
      "issue_type_custom_property": "custom-prop-uuid"
    }
  ]
}
```

### Create Issue API Response Codes

- **201 Created**: Returns the created issue object with all its properties.
- **400 Bad Request**: If validation fails (e.g., invalid `state_id`, `parent`, `type_id`, or custom property format/values). The response body will contain details about the validation errors.
- **401 Unauthorized**: If authentication is missing or invalid.
- **403 Forbidden**: If the authenticated user does not have permission to create issues in the project.

### Create Issue API Validations

- `name` is a required field.
- `created_by` is a required field. If you have UUID, send it. If not, then add a name. It will create a default user for it.
- `state_id`, `type_id`, `parent` (if provided) must correspond to existing and valid UUIDs.
- `priority` must be one of the allowed string values: `urgent`, `high`, `medium`, `low`, `none`.
- `start_date` and `target_date` must be valid dates in YYYY-MM-DD format.
- `assignees` and `labels` must be arrays of valid UUIDs.
- `custom_properties`:
  - `key` and `issue_type_custom_property` are required for each custom property object.
  - `value` is required and its type should match `data_type`.
  - `data_type` must be one of `string`, `number`, `boolean`, `date`.

### Create Issue API Default Values

- If `created_by` is not provided, the current authenticated user's ID is used.
- If `assignees` is not provided, the default assignee(s) for the project will be used, if configured. Otherwise, it may be empty.
- Other optional fields, if not provided, will generally be `null` or an empty equivalent (e.g., empty array for `labels`).

### Notes

- If `created_by` is not provided, the current authenticated user is used.
- If `assignees` is not provided, the default assignee for the project is used (if set).
- All fields like `hub_code`, `vendor_code`, `customer_code`, `worker_code`, `reference_number`, `trip_reference_number`, `hub_name`, `customer_name`, `vendor_name`, `worker_name` are optional and can be used for logistics/operations use cases.
- You can also attach custom properties for extensibility.

### Create Issue API Response Body

The response will return a issue JSON object with the following fields:

| Field                  | Type      | Description                                                                 |
|------------------------|-----------|-----------------------------------------------------------------------------|
| id                     | UUID      | Unique identifier for the issue                                             |
| workspace              | UUID      | Workspace ID                                                                |
| project                | UUID      | Project ID                                                                  |
| name                   | string    | Issue name                                                                  |
| state                  | object    | State object (may be expanded or just an ID)                                |
| state_id               | UUID      | State ID (if not expanded)                                                  |
| priority               | string    | Priority (urgent, high, medium, low, none)                                  |
| start_date             | date      | Start date (YYYY-MM-DD)                                                     |
| target_date            | date      | Target date (YYYY-MM-DD)                                                    |
| assignees              | [UUID/object] | List of user IDs or user objects (if expanded)                         |
| labels                 | [UUID/object] | List of label IDs or label objects (if expanded)                       |
| type                   | object    | Issue type object (may be expanded or just an ID)                           |
| type_id                | UUID      | Issue type ID (if not expanded)                                             |
| parent                 | UUID      | Parent issue ID                                                             |
| hub_code               | string    | Hub code                                                                    |
| vendor_code            | string    | Vendor code                                                                 |
| customer_code          | string    | Customer code                                                               |
| worker_code            | string    | Worker code                                                                 |
| reference_number       | string    | Reference number                                                            |
| trip_reference_number  | string    | Trip reference number                                                       |
| hub_name               | string    | Hub name                                                                    |
| customer_name          | string    | Customer name                                                               |
| vendor_name            | string    | Vendor name                                                                 |
| worker_name            | string    | Worker name                                                                 |
| source                 | string    | Source                                                                      |
| external_source        | string    | External source identifier                                                  |
| external_id            | string    | External ID                                                                 |
| sequence_id            | integer   | Issue sequence number                                                       |
| sort_order             | float     | Sort order                                                                  |
| completed_at           | datetime  | Completion timestamp                                                        |
| archived_at            | date      | Archive date                                                                |
| is_draft               | boolean   | Is draft issue                                                              |
| created_by             | UUID/object | Creator's user ID or user object (if expanded)                          |
| updated_by             | UUID/object | Last updater's user ID or user object (if expanded)                     |
| created_at             | datetime  | Creation timestamp                                                          |
| updated_at             | datetime  | Last update timestamp                                                       |
| custom_properties      | array     | List of custom property objects (see below)                                 |
| ...                    | ...       | Any additional fields added by plugins or customizations                    |

#### Create Issue API Example Response

```json
{
  "id": "issue-uuid",
  "workspace": "workspace-uuid",
  "project": "project-uuid",
  "name": "Deliver package to hub",
  "state": { "id": "state-uuid", "name": "In Progress" },
  "priority": "high",
  "start_date": "2024-06-01",
  "target_date": "2024-06-10",
  "assignees": ["uuid1", "uuid2"],
  "labels": ["label-uuid"],
  "type": { "id": "type-uuid", "name": "Task" },
  "parent": null,
  "hub_code": "HUB123",
  "vendor_code": "VEND456",
  "customer_code": "CUST789",
  "worker_code": "WORK001",
  "reference_number": "REF-2024-001",
  "trip_reference_number": "TRIP-2024-001",
  "hub_name": "Main Hub",
  "customer_name": "Acme Corp",
  "vendor_name": "VendorX",
  "worker_name": "John Doe",
  "source": null,
  "external_source": null,
  "external_id": null,
  "sequence_id": 1,
  "sort_order": 65535,
  "completed_at": null,
  "archived_at": null,
  "is_draft": false,
  "created_by": "user-uuid",
  "updated_by": "user-uuid",
  "created_at": "2024-06-01T12:00:00Z",
  "updated_at": "2024-06-01T12:00:00Z",
  "custom_properties": [
    {
      "id": "custom-prop-uuid",
      "key": "weight",
      "value": "10",
      "data_type": "number",
      "int_value": 10,
      "bool_value": null,
      "date_value": null,
      "issue_type_custom_property": "custom-prop-type-uuid",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "created_at": "2024-06-01T12:00:00Z",
      "updated_at": "2024-06-01T12:00:00Z"
    }
  ]
}
```

If you need the full list of all possible fields or want to see the response schema, let me know!

## Fetch Issues API

**Endpoint:**

```text
GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/
```

### Fetch Issues API Query Parameters

| Parameter      | Type    | Description                                                                 |
|---------------|---------|-----------------------------------------------------------------------------|
| per_page       | int     | Number of items per page (default: 1000, max: 1000). Defines the slice size for pagination. |
| cursor         | string  | Pagination cursor in the format "per_page:offset:is_prev". Defaults to "per_page:0:0" if not provided. |
| order_by       | string  | Field to sort by (e.g., `created_at`, `priority`, `-created_at`)            |
| filters        | object  | JSON object with filter criteria (see below)                                |
| expand         | string  | Comma-separated list of related fields to expand (e.g., `assignees,labels`) |

#### Filtering

You can filter issues by any of the following fields (as query params or in a `filters` JSON object):

- `state_id`, `priority`, `assignees`, `labels`, `type_id`, `parent`, `hub_code`, `vendor_code`, `customer_code`, `worker_code`, `reference_number`, `trip_reference_number`, `hub_name`, `customer_name`, `vendor_name`, `worker_name`, `created_at`, `updated_at`, etc.

In addition to the above, you can now filter issues using timestamp-level precision with the following new query parameters:

- `created_at_ts`: Filters issues based on the exact creation timestamp. This parameter accepts an ISO 8601 formatted timestamp with millisecond precision (e.g., `2024-06-01T12:00:00.000Z`). It can optionally be followed by a semicolon and a condition (`after`, `before`) to indicate the filter type. For example, `?created_at_ts=2024-06-01T12:00:00.000Z;after` returns issues created after that timestamp, and `?created_at_ts=2024-06-01T12:00:00.000Z;after,2024-06-01T12:15:00.000Z;before` returns issues created between the two timestamps.

- `updated_at_ts`: Works similarly to `created_at_ts` but applies to the update timestamp of the issue.

**Filtering by Issue Status:**
You can filter by the issue's state (status) using:

- `state_id`: comma-separated list of state UUIDs to return issues in those exact states. (e.g., `?state_id=state1-uuid,state2-uuid`)
- `state_group`: comma-separated workflow group names (`backlog`, `unstarted`, `started`, `completed`, `cancelled`). (e.g., `?state_group=backlog,started`)

**Multiple Hub Codes:**
For `hub_code`, you can specify multiple codes as a comma-separated list to match any of the provided hubs. For example, `?hub_code=HUB123,HUB456` filters issues belonging to either HUB123 or HUB456.

**Example filter as query string:**

```text
?priority=high&state_id=state-uuid&hub_code=HUB123
```

#### Pagination

- Pagination is enabled by default.
- Use `per_page` and `cursor` to control which results you get.
- The response includes pagination metadata.
- For reference check [Plane Pagination Documenation](https://developers.plane.so/api-reference/introduction#pagination-documentation)

### Fetch Issues API Response Codes

- **200 OK**: Returns a paginated list of issues matching the filters.
- **400 Bad Request**: If filter parameters are invalid (e.g., incorrect `filters` JSON structure, invalid `order_by` field, non-integer `per_page` or `cursor`).
- **401 Unauthorized**: If authentication is missing or invalid.
- **403 Forbidden**: If the authenticated user does not have permission to view issues in the project.

### Fetch Issues API Validations

- `per_page` and `cursor` must be positive integers. `per_page` has a maximum limit (e.g., 1000).
- `order_by` should be a valid field name, optionally prefixed with `-` for descending order.
- `filters` (if provided as a JSON object) must be a valid JSON object. Filter keys and values must be appropriate for the fields being filtered.
- `expand` should be a comma-separated string of valid relation names.

### Fetch Issues API Default Values

- `per_page` defaults to `20`.
- `cursor` defaults to `"per_page:0:0"`.
- `order_by` might default to a standard field like `created_at` or `sequence_id` if not specified.

### Fetch Issues API Pagination Response Metadata

The paginated response includes the following metadata fields:

| Field             | Type    | Description                                                      |
|-------------------|---------|------------------------------------------------------------------|
| grouped_by        | string  | Field used for grouping results (typically null if not grouped)    |
| sub_grouped_by    | string  | Field used for sub-grouping (typically null if not applicable)     |
| total_count       | int     | Total number of issues matching the filters                      |
| next_cursor       | string  | Cursor for the next page in format "per_page:offset:is_prev"       |
| prev_cursor       | string  | Cursor for the previous page in format "per_page:offset:is_prev"    |
| next_page_results | bool    | Indicates if more results exist after the current page           |
| prev_page_results | bool    | Indicates if there are results before the current page           |
| count             | int     | Number of issues returned in the current page                    |
| total_pages       | int     | Total pages available based on the current `per_page` setting      |
| total_results     | int     | Same as `total_count`                                              |
| extra_stats       | object  | Additional statistics if available (usually null)                |
| results           | array   | List of issue objects as per the specified fields                  |

#### Fetch Issues API Example Pagination Metadata

```json
{
  "grouped_by": null,
  "sub_grouped_by": null,
  "total_count": 2,
  "next_cursor": "20:1:0",
  "prev_cursor": "20:0:1",
  "next_page_results": false,
  "prev_page_results": false,
  "count": 2,
  "total_pages": 1,
  "total_results": 2,
  "extra_stats": null,
  "results": [
    { /* ... issue object ... */ },
    { /* ... issue object ... */ }
  ]
}
```

### Fetch Issues API Response Body

The response is a paginated object with these fields:

| Field         | Type    | Description                                 |
|-------------- |---------|---------------------------------------------|
| count         | int     | Total number of issues matching the filters  |
| next          | string  | URL to the next page (if any)                |
| previous      | string  | URL to the previous page (if any)            |
| results       | array   | List of issue objects (see below)            |

#### Fetch Issues API Example Response

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "issue-uuid-1",
      "workspace": "workspace-uuid",
      "project": "project-uuid",
      "name": "Deliver package to hub",
      "state": { "id": "state-uuid", "name": "In Progress" },
      "priority": "high",
      "start_date": "2024-06-01",
      "target_date": "2024-06-10",
      "assignees": ["uuid1", "uuid2"],
      "labels": ["label-uuid"],
      "type": { "id": "type-uuid", "name": "Task" },
      "parent": null,
      "hub_code": "HUB123",
      "vendor_code": "VEND456",
      "customer_code": "CUST789",
      "worker_code": "WORK001",
      "reference_number": "REF-2024-001",
      "trip_reference_number": "TRIP-2024-001",
      "hub_name": "Main Hub",
      "customer_name": "Acme Corp",
      "vendor_name": "VendorX",
      "worker_name": "John Doe",
      "source": null,
      "external_source": null,
      "external_id": null,
      "sequence_id": 1,
      "sort_order": 65535,
      "completed_at": null,
      "archived_at": null,
      "is_draft": false,
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "created_at": "2024-06-01T12:00:00Z",
      "updated_at": "2024-06-01T12:00:00Z",
      "custom_properties": [
        {
          "id": "custom-prop-uuid",
          "key": "weight",
          "value": "10",
          "data_type": "number",
          "int_value": 10,
          "bool_value": null,
          "date_value": null,
          "issue_type_custom_property": "custom-prop-type-uuid",
          "created_by": "user-uuid",
          "updated_by": "user-uuid",
          "created_at": "2024-06-01T12:00:00Z",
          "updated_at": "2024-06-01T12:00:00Z"
        }
      ]
    },
    { /* ... more issues ... */ }
  ]
}
```

## Fetch Single Issue API

**Endpoint:**

```text
GET /api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/
```

### Fetch Single Issue API Path Parameters

| Parameter   | Type | Description         |
|-------------|------|---------------------|
| slug        | str  | Workspace slug      |
| project_id  | UUID | Project ID          |
| issue_id    | UUID | Issue ID            |

### Fetch Single Issue API Query Parameters

| Parameter | Type   | Description                                                        |
|-----------|--------|--------------------------------------------------------------------|
| expand    | string | Comma-separated list of related fields to expand (e.g. assignees,labels) |

### Fetch Single Issue API Response Codes

- **200 OK**: Returns the issue object if found.
- **401 Unauthorized**: If authentication is missing or invalid.
- **403 Forbidden**: If the authenticated user does not have permission to view the specified issue.
- **404 Not Found**: If the issue with the given `issue_id` does not exist or is not accessible.

### Fetch Single Issue API Validations

- `slug`, `project_id`, and `issue_id` in the path must be valid and correspond to existing resources.
- `expand` (if provided in query parameters) should be a comma-separated string of valid relation names.

### Fetch Single Issue API Default Values

- No specific default values for path parameters. Behavior for missing or invalid parameters results in an error (e.g., 404).

### Fetch Single Issue API Response Body

The response is a single issue object, with the same structure as described in the Create and Fetch Issues API sections.

#### Fetch Single Issue API Example Response

```json
{
  "id": "issue-uuid",
  "workspace": "workspace-uuid",
  "project": "project-uuid",
  "name": "Deliver package to hub",
  "state": { "id": "state-uuid", "name": "In Progress" },
  "priority": "high",
  "start_date": "2024-06-01",
  "target_date": "2024-06-10",
  "assignees": ["uuid1", "uuid2"],
  "labels": ["label-uuid"],
  "type": { "id": "type-uuid", "name": "Task" },
  "parent": null,
  "hub_code": "HUB123",
  "vendor_code": "VEND456",
  "customer_code": "CUST789",
  "worker_code": "WORK001",
  "reference_number": "REF-2024-001",
  "trip_reference_number": "TRIP-2024-001",
  "hub_name": "Main Hub",
  "customer_name": "Acme Corp",
  "vendor_name": "VendorX",
  "worker_name": "John Doe",
  "source": null,
  "external_source": null,
  "external_id": null,
  "sequence_id": 1,
  "sort_order": 65535,
  "completed_at": null,
  "archived_at": null,
  "is_draft": false,
  "created_by": "user-uuid",
  "updated_by": "user-uuid",
  "created_at": "2024-06-01T12:00:00Z",
  "updated_at": "2024-06-01T12:00:00Z",
  "custom_properties": [
    {
      "id": "custom-prop-uuid",
      "key": "weight",
      "value": "10",
      "data_type": "number",
      "int_value": 10,
      "bool_value": null,
      "date_value": null,
      "issue_type_custom_property": "custom-prop-type-uuid",
      "created_by": "user-uuid",
      "updated_by": "user-uuid",
      "created_at": "2024-06-01T12:00:00Z",
      "updated_at": "2024-06-01T12:00:00Z"
    }
  ]
}
```

## Update Issue API

**Endpoint:**

```text
PATCH /api/v1/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/
```

### Update Issue API Path Parameters

| Parameter   | Type | Description    |
|-------------|------|----------------|
| slug        | str  | Workspace slug |
| project_id  | UUID | Project ID     |
| issue_id    | UUID | Issue ID       |

### Update Issue API Request Body

- Any updatable field from the issue object (see Create API for all fields).
- Only the fields you want to update need to be included.

**Example:**

```json
{
  "priority": "medium",
  "state_id": "new-state-uuid",
  "hub_code": "NEW-HUB"
}
```

### Update Issue API Response Codes

- **200 OK**: Returns the updated issue object.
- **400 Bad Request**: If validation fails for any of the provided fields (similar to Create API validations, e.g., invalid `state_id`, incorrect data type for a field). The response body will contain details.
- **401 Unauthorized**: If authentication is missing or invalid.
- **403 Forbidden**: If the authenticated user does not have permission to update the specified issue.
- **404 Not Found**: If the issue with the given `issue_id` does not exist or is not accessible.

### Update Issue API Validations

- `slug`, `project_id`, and `issue_id` in the path must be valid.
- Any fields provided in the request body will be validated according to their type and constraints (e.g., `priority` must be one of the allowed values, `state_id` must be a valid UUID).

### Update Issue API Default Values

- No fields are defaulted during an update; only provided fields are changed.

#### Update Issue API Example Response

```json
{
  "id": "issue-uuid",
  "workspace": "workspace-uuid",
  "project": "project-uuid",
  "name": "Deliver package to hub",
  "state_id": "new-state-uuid",
  "priority": "medium",
  // ... other fields ...
}
```
