# Eraser diagrams in Plane

Plane stores a workspace's Eraser team API token encrypted with the instance secret key. Workspace admins connect or disconnect Eraser in **Workspace settings → Integrations**. The token is sent only to Plane's API and is never returned by a read endpoint.

The editor saves the original `https://app.eraser.io/workspace/<file-id>` link, with an optional `diagram` or `figure` query parameter. Pasting one of these links inserts a diagram block. The `/eraser` command inserts an empty block where a link can be entered. On opening the document, the block asks Plane's API for a 15 minute embed URL. The API calls Eraser's `POST /api/embedTokens` with the stored team token, and the editor refreshes the iframe URL before expiry. A link to the original file remains available if an embed cannot be loaded.

Issue links already have a link model and add-link dialog. Eraser links added there appear in the issue sidebar, where Plane reads the current title through Eraser's `GET /api/files/{fileId}` endpoint. There is no duplicate issue-to-diagram table.

## API

- `GET /api/workspaces/{slug}/eraser/` returns connection status to a workspace admin.
- `PUT /api/workspaces/{slug}/eraser/` accepts `{ "api_token": "..." }`. The API validates the token with `GET /api/files?limit=1` before saving it.
- `DELETE /api/workspaces/{slug}/eraser/` removes the connection.
- `POST /api/workspaces/{slug}/eraser/embed/` accepts `{ "url": "..." }` from a workspace member and returns a short lived `embed_url` and `expires_at`.
- `GET /api/workspaces/{slug}/eraser/metadata/?url=...` returns the file title to a workspace member.

Both read endpoints accept only links on `app.eraser.io`; the Eraser API host is fixed on the server. This first version targets Eraser's hosted service. A team API token and Eraser paid plan are required for embeds.

Eraser currently documents no webhook for file updates. Each new iframe load reads the current file; an iframe that stays open is refreshed when its token approaches expiry. Eraser's file API does not provide a thumbnail in its response, so the sidebar displays the title and link.

## Verification

Run the API contract tests with `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_eraser_integration.py`. Run `pnpm check` after installing workspace dependencies. Connecting to a real Eraser team requires a paid team's API token and a file that Eraser allows embedding.
