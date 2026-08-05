import { STICKY_MARKER } from "./format-report";
import { log } from "./log";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

interface IssueComment {
  readonly id: number;
  readonly body?: string;
}

export interface PrCommentTarget {
  readonly token: string;
  readonly repository: string;
  readonly prNumber: number;
}

function headers(token: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-github-api-version": API_VERSION,
  };
}

async function request(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, { ...init, headers: headers(token) });
  if (!response.ok) {
    throw new Error(`GitHub API ${init.method ?? "GET"} ${url} failed: ${response.status}`);
  }
  return response;
}

async function findStickyComment(target: PrCommentTarget): Promise<number | null> {
  const url = `${GITHUB_API}/repos/${target.repository}/issues/${target.prNumber}/comments?per_page=100`;
  const response = await request(url, target.token);
  const comments = (await response.json()) as IssueComment[];
  return comments.find((comment) => comment.body?.includes(STICKY_MARKER))?.id ?? null;
}

/**
 * Creates the scan's comment on first run and updates that same comment on every
 * later run, so a PR accumulates one comment rather than one per push.
 */
export async function postStickyComment(target: PrCommentTarget, body: string): Promise<void> {
  const existingId = await findStickyComment(target);

  if (existingId === null) {
    await request(`${GITHUB_API}/repos/${target.repository}/issues/${target.prNumber}/comments`, target.token, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    log.info("Posted security scan comment.");
    return;
  }

  await request(`${GITHUB_API}/repos/${target.repository}/issues/comments/${existingId}`, target.token, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
  log.info("Updated existing security scan comment.");
}
