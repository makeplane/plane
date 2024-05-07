import { useMobxStore } from "@/lib/mobx/store-provider";
import { RootStore } from "@/store/root.store";

const useEditorSuggestions = () => {
  const { mentionsStore }: RootStore = useMobxStore();

  return {
    // mentionSuggestions: mentionsStore.mentionSuggestions,
    mentionHighlights: mentionsStore.mentionHighlights,
  };
};

export default useEditorSuggestions;
