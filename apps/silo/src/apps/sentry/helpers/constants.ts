/* ------------------ Comment Messages ------------------ */
export const getSentryIssueLinkedSuccessMessage = (
  title: string,
  webUrl: string,
  config: { resolvedState: string; unresolvedState: string; isDefault: boolean } | undefined
) => {
  if (!config) {
    return `✅ Sentry issue linked successfully! 🎉<blockquote><a href="${webUrl}" rel="noopener noreferrer">${title}</a>
</blockquote>`;
  }

  const resolvedState = config?.resolvedState;
  const unresolvedState = config?.unresolvedState;
  const message = config?.isDefault
    ? "According to the default configuration,"
    : "According to your project state configuration,";

  return `
✅ Sentry issue linked successfully! 🎉<blockquote><a href="${webUrl}" rel="noopener noreferrer">${title}</a>

  ℹ️ **Important**:
  ${message}
  • Moving to ${resolvedState} state → Sentry issue marked resolved
  • Moving back → Reverts the status
  • Resolving in Sentry → Work item moves to ${unresolvedState}
  • You can disconnect the issue from Sentry
</blockquote>`;
};

export const getSentryIssueDelinkMessage = (title: string, webUrl: string) => `
🔗 Sentry issue unlinked<blockquote>
  <a href="${webUrl}" rel="noopener noreferrer">${title}</a>

  ℹ️ **Note**:\nWork item state changes will no longer affect Sentry issue status. You can reconnect by linking the work item again in Sentry.
</blockquote>`;

export const getSentryMarkedResolvedMessage = (title: string, webUrl: string) => `
✅ Sentry issue resolved successfully<blockquote>
<a href="${webUrl}" rel="noopener noreferrer">${title}</a>
</blockquote>`;

export const getSentryMarkedUnresolvedMessage = (title: string, webUrl: string) => `
⚠️  Sentry issue marked as unresolved<blockquote>
<a href="${webUrl}" rel="noopener noreferrer">${title}</a>
</blockquote>`;

export const getStatusDoneMessage = (title: string, webUrl: string, resolvedState: string) => `
✅ Sentry issue has been resolved
🎯 Work Item moved to "${resolvedState}"<blockquote>
<a href="${webUrl}" rel="noopener noreferrer">${title}</a>
</blockquote>`;

export const getStatusBacklogMessage = (title: string, webUrl: string, unresolvedState: string) => `
↪️  Sentry issue has been reopened
📥 Work Item moved to "${unresolvedState}"<blockquote>
<a href="${webUrl}" rel="noopener noreferrer">${title}</a>
</blockquote>`;

export const getSentryDanglingIssueMessage = (title: string, webUrl: string) => `
🔗 Sentry issue unlinked<blockquote>
  <a href="${webUrl}" rel="noopener noreferrer">${title}</a>

  ℹ️ **Note**:\nThis issue is no longer linked with any external issue, it was disconnected from sentry. You can reconnect by linking the work item again in Sentry.
</blockquote>`;
/* ------------------ Comment Messages ------------------ */

/* ------------------ URL Extractor ------------------ */
export const getSentryIssueUrl = (orgSlug: string, issueId: string) =>
  `https://${orgSlug}.sentry.io/issues/${issueId}/`;
