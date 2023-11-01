import { IMentionHighlight, IMentionSuggestion } from "@plane/rich-text-editor";
import useProjectMembers from "./use-project-members";
import useUser from "./use-user";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const useEditorSuggestions = (
    _workspaceSlug: string | undefined,
    _projectId: string | undefined,
) => {
    const { mentionsStore }: RootStore = useMobxStore()

    return {
        mentionSuggestions: mentionsStore.mentionSuggestions,
        mentionHighlights: mentionsStore.mentionHighlights
    }
};

export default useEditorSuggestions;