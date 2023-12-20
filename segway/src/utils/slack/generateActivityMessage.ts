export const addSpaceIfCamelCase = (str: string) =>
  str.replace(/([a-z])([A-Z])/g, "$1 $2");
export const stripHtmlTags = (htmlString: string) =>
  htmlString.replace(/(<([^>]+)>)/gi, "");

export const renderShortNumericDateFormat = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-UK", {
    day: "numeric",
    month: "short",
  });

const activityDetails: {
  [key: string]: {
    message?: string;
  };
} = {
  blocked_by: {
    message: "marked this issue being blocked by",
  },
  blocking: {
    message: "marked this issue is blocking",
  },
  cycles: {
    message: "set the cycle to",
  },
  labels: {},
  modules: {
    message: "set the module to",
  },
  state: {
    message: "set the state to",
  },
  priority: {
    message: "set the priority to",
  },
  name: {
    message: "edited the name to",
  },
  description: {
    message: "updated the description.",
  },
  start_date: {
    message: "set the start date to",
  },
  target_date: {
    message: "set the due date to",
  },
  parent: {
    message: "set the parent to",
  },
  estimate_point: {
    message: "set the estimate point to",
  },
  link: {
    message: "updated the link",
  },
  attachment: {
    message: "updated the attachment",
  },
  comment: {
    message: "added a comment on the issue",
  },
};

export const issueActivitySummary = async (activityItem) => {
  let action =
    activityDetails[activityItem.field as keyof typeof activityDetails]
      ?.message;

  let plainText = "";
  if (activityItem.field === "labels") {
    action =
      activityItem.new_value !== "" ? "added a new label" : "removed the label";
  } else if (activityItem.field === "assignees") {
    action =
      activityItem.new_value !== ""
        ? "added a new assignee"
        : "removed the assignee";
  } else if (activityItem.field === "blocking") {
    action =
      activityItem.new_value !== ""
        ? "marked this issue is blocking"
        : "removed the issue from blocking";
  } else if (activityItem.field === "blocked_by") {
    action =
      activityItem.new_value !== ""
        ? "marked this issue being blocked by"
        : "removed blocker";
  } else if (activityItem.field === "relates_to") {
    action =
      activityItem.new_value !== ""
        ? "marked this issue being related to"
        : "removed related issue";
  } else if (activityItem.field === "duplicate") {
    action =
      activityItem.new_value !== ""
        ? "marked this issue being duplicate to"
        : "removed duplicate issue";
  } else if (activityItem.field === "target_date") {
    action =
      activityItem.new_value && activityItem.new_value !== ""
        ? "set the due date to"
        : "removed the due date";
  } else if (activityItem.field === "parent") {
    action =
      activityItem.new_value && activityItem.new_value !== ""
        ? "set the parent to"
        : "removed the parent";
  } else if (activityItem.field === "priority") {
    action =
      activityItem.new_value && activityItem.new_value !== ""
        ? "set the priority to"
        : "removed the priority";
  } else if (activityItem.field === "description") {
    action = "updated the";
  } else if (activityItem.field === "attachment") {
    action = `${activityItem.verb} an`;
  } else if (activityItem.field === "link") {
    action =
      activityItem.verb === "created"
        ? `${activityItem.verb} a`
        : `${activityItem.verb} a`;
  } else if (activityItem.field === "estimate_point") {
    action = "set the estimate point to";
  } else if (activityItem.field === "cycles") {
    action =
      activityItem.new_value !== ""
        ? "set the cycle to"
        : "removed it from cycle";
  } else if (activityItem.field === "modules") {
    action =
      activityItem.new_value !== ""
        ? "set the module to"
        : "removed it from module";
  } else if (activityItem.field === "comment") {
    action =
      activityItem.verb === "updated"
        ? "edited a comment on the issue"
        : "added a comment on the issue";
  }

  let value: any = activityItem.new_value
    ? activityItem.new_value
    : activityItem.old_value;

  // for values that are after the action clause
  if (
    activityItem.verb === "created" &&
    activityItem.field !== "cycles" &&
    activityItem.field !== "modules" &&
    activityItem.field !== "attachment" &&
    activityItem.field !== "link" &&
    activityItem.field !== "estimate_point" &&
    activityItem.field !== "comment" &&
    activityItem.field !== "blocking" &&
    activityItem.field !== "blocked_by" &&
    activityItem.field !== "duplicate" &&
    activityItem.field !== "relates_to"
  ) {
    value = "created this issue.";
  } else if (activityItem.field === "state") {
    value = activityItem.new_value
      ? addSpaceIfCamelCase(activityItem.new_value)
      : "None";
  } else if (activityItem.field === "labels") {
    let name;
    let id = "#000000";
    if (activityItem.new_value !== "") {
      name = activityItem.new_value;
      id = activityItem.new_identifier ? activityItem.new_identifier : id;
    } else {
      name = activityItem.old_value;
      id = activityItem.old_identifier ? activityItem.old_identifier : id;
    }

    value = name;
  } else if (activityItem.field === "assignees") {
    value = activityItem.new_value;
  } else if (activityItem.field === "target_date") {
    const date =
      activityItem.new_value && activityItem.new_value !== ""
        ? activityItem.new_value
        : activityItem.old_value;
    value = renderShortNumericDateFormat(date as string);
  } else if (activityItem.field === "description") {
    value = "description";
  } else if (activityItem.field === "attachment") {
    value = "attachment";
  } else if (activityItem.field === "cycles") {
    if (activityItem.verb === "deleted") {
      value = `${activityItem.old_value}`;
    } else {
      value = activityItem.new_value;
    }
  } else if (activityItem.field === "modules") {
    if (activityItem.verb === "deleted") {
      value = `${activityItem.old_value}`;
    } else {
      value = activityItem.new_value;
    }
  } else if (activityItem.field === "comment") {
    value = stripHtmlTags(activityItem.new_value);
  } else if (activityItem.field === "link") {
    plainText = "link";
    value =
      activityItem.verb === "created"
        ? `<${activityItem.new_value}|Link>`
        : "link";
  }

  let activityString = "";
  let plainTextActivityString = "";
  if (action) {
    if (plainText !== "") {
      plainTextActivityString = `${activityItem.actor_detail.first_name} ${activityItem.actor_detail.last_name} ${action} ${plainText}`;
    }
    activityString = `${activityItem.actor_detail.first_name} ${activityItem.actor_detail.last_name} ${action} ${value}`;
  } else {
    if (plainText !== "") {
      plainTextActivityString = `${activityItem.actor_detail.first_name} ${activityItem.actor_detail.last_name} ${action} ${plainText}`;
    }
    activityString = `${activityItem.actor_detail.first_name} ${activityItem.actor_detail.last_name} ${value}`;
  }

  return {
    activityString: activityString,
    plainTextActivityString: plainTextActivityString,
  };
};
