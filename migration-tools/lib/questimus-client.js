// Questimus (Plane) API client — thin wrapper around the v1 API (X-Api-Key auth)
// and the main API (X-Api-Key auth after the fork change, migration-karol.md §7.4;
// otherwise the main API accepts session auth only).
//
// Verified against the code (Plane v1.4.2 fork):
//   - v1 create work-item payload uses `state` (not `state_id`), `external_source`,
//     `external_id`, `description_html`, `priority`, `labels`, `created_at`.
//   - v1 create returns 409 + existing id when external_source+external_id exist.
//   - v1 list endpoints return { results: [...] } (paginated) or plain arrays.
//
// Usage:
//   const client = new QuestimusClient({ baseUrl, apiKey });
//   const issues = await client.listWorkItems("questimus", projectId, { state: stateId });

const V1 = "/api/v1";
const MAIN = "/api";

export class QuestimusError extends Error {
  constructor(status, body, method, url) {
    super(`Questimus API ${method} ${url} → HTTP ${status}: ${String(body).slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

export class QuestimusClient {
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  async request(method, path, { body, form } = {}) {
    const headers = { "X-Api-Key": this.apiKey };
    let payload;
    if (form) {
      payload = form; // FormData (multipart)
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(this.baseUrl + path, { method, headers, body: payload });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new QuestimusError(res.status, text, method, path);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ---- v1 API (token auth; no fork change needed) ----

  listProjects(slug, params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${qs ? `?${qs}` : ""}`);
  }

  // v1 DELETE is a hard delete ("cannot be undone") — used for the leftover test project
  deleteProject(slug, projectId) {
    return this.request("DELETE", `${V1}/workspaces/${slug}/projects/${projectId}/`);
  }

  listStates(slug, projectId) {
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/states/`);
  }

  createState(slug, projectId, data) {
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/states/`, { body: data });
  }

  updateState(slug, projectId, stateId, data) {
    return this.request("PATCH", `${V1}/workspaces/${slug}/projects/${projectId}/states/${stateId}/`, { body: data });
  }

  deleteState(slug, projectId, stateId) {
    return this.request("DELETE", `${V1}/workspaces/${slug}/projects/${projectId}/states/${stateId}/`);
  }

  listLabels(slug, projectId) {
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/labels/`);
  }

  createLabel(slug, projectId, data) {
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/labels/`, { body: data });
  }

  listWorkItems(slug, projectId, params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${qs ? `?${qs}` : ""}`);
  }

  createWorkItem(slug, projectId, data) {
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/`, { body: data });
  }

  getWorkItem(slug, projectId, workItemId) {
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/`);
  }

  updateWorkItem(slug, projectId, workItemId, data) {
    return this.request("PATCH", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/`, { body: data });
  }

  createRelation(slug, projectId, workItemId, data) {
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/relations/`, { body: data });
  }

  listRelations(slug, projectId, workItemId) {
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/relations/`);
  }

  createComment(slug, projectId, workItemId, commentHtml) {
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/comments/`, { body: { comment_html: commentHtml } });
  }

  uploadAttachment(slug, projectId, workItemId, { name, type, data }) {
    const form = new FormData();
    form.append("name", name);
    form.append("type", type);
    form.append("size", String(data.length));
    form.append("file", new Blob([data], { type }), name);
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/work-items/${workItemId}/attachments/`, { form });
  }

  // ---- main API (token auth requires the fork change, migration-karol.md §7.4) ----

  createProject(slug, data) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/projects/`, { body: data });
  }

  updateProject(slug, projectId, data) {
    return this.request("PATCH", `${MAIN}/workspaces/${slug}/projects/${projectId}/`, { body: data });
  }

  createModule(slug, projectId, data) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/projects/${projectId}/modules/`, { body: data });
  }

  addIssueToModule(slug, projectId, moduleId, issueId) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/issues/`, { body: { issues: [issueId] } });
  }

  listPages(slug, projectId) {
    return this.request("GET", `${MAIN}/workspaces/${slug}/projects/${projectId}/pages/`);
  }

  createPage(slug, projectId, data) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/projects/${projectId}/pages/`, { body: data });
  }

  // ---- views (main API; token auth after the fork change §7.4) ----
  // The view's `filters` use the legacy format the UI understands:
  // { priority: [...], state: [...], labels: [...], assignees: [...], issue_type: [...] }

  listWorkspaceViews(slug) {
    return this.request("GET", `${MAIN}/workspaces/${slug}/views/`);
  }

  createWorkspaceView(slug, data) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/views/`, { body: data });
  }

  listProjectViews(slug, projectId) {
    return this.request("GET", `${MAIN}/workspaces/${slug}/projects/${projectId}/views/`);
  }

  createProjectView(slug, projectId, data) {
    return this.request("POST", `${MAIN}/workspaces/${slug}/projects/${projectId}/views/`, { body: data });
  }

  // ---- estimates (v1 API) ----
  // NOTE (verified in the code): the v1 estimates endpoints are NOT paginated
  // lists:
  //   GET  .../estimates/            → single estimate object (404 if none)
  //   POST .../estimates/            → 201, or 409 if one already exists (body has "id")
  //   GET  .../estimates/{id}/estimate-points/  → plain array
  //   POST .../estimates/{id}/estimate-points/ → BULK create (expects a list)

  async listEstimates(slug, projectId) {
    try {
      const res = await this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/estimates/`);
      return { results: Array.isArray(res) ? res : [res] };
    } catch (err) {
      if (err instanceof QuestimusError && err.status === 404) return { results: [] };
      throw err;
    }
  }

  async createEstimate(slug, projectId, data) {
    try {
      return await this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/estimates/`, { body: data });
    } catch (err) {
      if (err instanceof QuestimusError && err.status === 409) {
        // One estimate per project — reuse the existing one
        const id = JSON.parse(err.body || "{}").id;
        if (id) return { id };
        throw err;
      }
      throw err;
    }
  }

  async listEstimatePoints(slug, projectId, estimateId) {
    return this.request("GET", `${V1}/workspaces/${slug}/projects/${projectId}/estimates/${estimateId}/estimate-points/`);
  }

  createEstimatePoint(slug, projectId, estimateId, data) {
    // The endpoint is a bulk create — send a single-element list
    return this.request("POST", `${V1}/workspaces/${slug}/projects/${projectId}/estimates/${estimateId}/estimate-points/`, { body: [data] });
  }
}
