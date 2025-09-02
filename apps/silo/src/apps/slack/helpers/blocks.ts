
export enum E_MUTATION_CONTEXT_ITEM_TYPE {
  WORK_ITEM = "work item",
  INTAKE = "intake",
}

export enum E_MUTATION_CONTEXT_FORMAT_TYPE {
  CREATION_ONLY = "creation-only",
  CREATION_AND_UPDATE = "creation-and-update",
  UPDATE_ONLY = "update-only",
}

export const createSlackLinkbackMutationContext = (params: {
  issueCtx: {
    createdBy?: {
      id: string;
      display_name: string;
    };
    updatedBy?: {
      id: string;
      display_name: string;
    };
  };
  planeToSlackUserMap: Map<string, string>;
  workspaceSlug: string;
  options?: {
    itemType?: E_MUTATION_CONTEXT_ITEM_TYPE;
    showUpdateInfo?: boolean;
    format?: E_MUTATION_CONTEXT_FORMAT_TYPE;
  };
}) => {
  const { issueCtx, options = {} } = params;
  const {
    itemType = E_MUTATION_CONTEXT_ITEM_TYPE.WORK_ITEM,
    showUpdateInfo = false,
    format = E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_ONLY,
  } = options;

  // Handle update-only format
  if (format === E_MUTATION_CONTEXT_FORMAT_TYPE.UPDATE_ONLY) {
    if (!issueCtx.updatedBy) {
      return ""; // Return empty string if no update info available
    }

    const updateUser = issueCtx.updatedBy.display_name;
    return `_${updateUser}_ updated this ${itemType}`;
  }

  // Determine the user to display (prefer created_by, fallback to updated_by)
  const user = issueCtx.createdBy
    ? issueCtx.createdBy.display_name
    : issueCtx.updatedBy
      ? issueCtx.updatedBy.display_name
      : "Unknown User";

  let content = `_${user}_ ${itemType === E_MUTATION_CONTEXT_ITEM_TYPE.INTAKE ? "created" : "added"} this ${itemType}`;

  // Add update information if requested and available
  if (format === E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_AND_UPDATE && showUpdateInfo && issueCtx.updatedBy) {
    content += `\n_${issueCtx.updatedBy.display_name}_ updated this ${itemType}`;
  }

  return content;
};
