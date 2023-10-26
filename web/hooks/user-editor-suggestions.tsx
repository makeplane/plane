import { IMentionHighlight, IMentionSuggestion } from "@plane/rich-text-editor";
import useProjectMembers from "./use-project-members";
import useUser from "./use-user";

const useEditorSuggestions = (
    workspaceSlug: string | undefined,
    projectId: string | undefined,
) => {
    const projectMembers = useProjectMembers(workspaceSlug as string | undefined, projectId).members
    const user = useUser().user

    const mentionSuggestions: IMentionSuggestion[] = !projectMembers ? [] : projectMembers.map((member) => ({
        id: member.member.id,
        type: "User",
        title: member.member.display_name,
        subtitle: member.member.email,
        avatar: member.member.avatar,
        redirect_uri: `/${member.workspace.slug}/profile/${member.member.id}`,
    })
    )

    const mentionHighlights: IMentionHighlight[] = user ? [user.id] : []

    return {
        mentionSuggestions,
        mentionHighlights
    }

};

export default useEditorSuggestions;