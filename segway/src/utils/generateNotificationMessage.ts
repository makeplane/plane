export function generateNotificationMessage(notification: any) {
  // Extract necessary details from notification
  const triggeredBy = notification.triggeredBy.is_bot
    ? notification.triggeredBy.firstName
    : notification.triggeredBy.displayName;
  const issueActivityField = notification.data.issue_activity.field;
  const issueActivityVerb = notification.data.issue_activity.verb;
  const issueActivityNewValue = notification.data.issue_activity.new_value;

  // Generate notification message
  let message = `${triggeredBy} `;
  if (issueActivityField !== "comment" && issueActivityVerb) {
    message += `${issueActivityVerb} `;
  }
  if (issueActivityField === "comment") {
    message += "commented ";
  } else if (issueActivityField !== "None") {
    message += `${replaceUnderscoreIfSnakeCase(issueActivityField)} to `;
  }
  if (issueActivityNewValue) {
    message += issueActivityNewValue;
  } else {
    message += "the issue and assigned it to you.";
  }

  return message;
}

export const replaceUnderscoreIfSnakeCase = (str: string) =>
  str.replace(/_/g, " ");
