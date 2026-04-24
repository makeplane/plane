# GKG HTTP API

Base URL: `http://localhost:27495`

## Server Info

```
GET /api/info
```
Returns port, version.

## Workspace Management

### List Workspaces
```
GET /api/workspace/list
```
Returns all indexed workspaces and projects.

### Index Workspace
```
POST /api/workspace/index
Content-Type: application/json

{"path": "/path/to/workspace"}
```
Index or re-index workspace.

### Delete Workspace
```
DELETE /api/workspace/delete
Content-Type: application/json

{"path": "/path/to/workspace"}
```

### Delete Project
```
DELETE /api/project/delete
Content-Type: application/json

{
  "project_path": "/path/to/project",
  "workspace_path": "/path/to/workspace"
}
```

## Graph Queries

### Initial Graph Data
```
GET /api/graph/initial?project=/path/to/project
```
Fetch visualization starting data.

### Neighbors
```
GET /api/graph/neighbors?node_id=xxx&project=/path
```
Get connected nodes for exploration.

### Search
```
GET /api/graph/search?pattern=MyClass&project=/path
```
Search definitions by pattern.

### Statistics
```
GET /api/graph/stats?project=/path
```
Returns: files, definitions, relationships counts.

## Real-time Events

```
GET /api/events
```
Server-Sent Events stream. Event types:
- `gkg-connection`: Connection status
- `gkg-event`: Indexing progress updates

## Error Handling

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request |
| 404 | Not found |
| 500 | Server error |

Response format:
```json
{
  "error": "message",
  "code": "ERROR_CODE"
}
```

## CORS

Accepts localhost origins. No authentication required locally.
