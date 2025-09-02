import { TEditorCommands } from "@plane/editor";
import { TEditorParams } from "@/types/editor";

declare global {
  interface Window {
    flutter_inappwebview: {
      callHandler(method: string, args?: string): Promise<any>;
    };
    // use-mobile-editor.ts
    resetInitialParams: (params: TEditorParams) => void;
    sendHtmlContent: () => string | undefined;
    executeAction: (actionKey: TEditorCommands) => void;
    unfocus: () => void;
    scrollToFocus: () => void;
    // use-mentions.ts
    getMembers: () => Promise<any[]>;
    setMembers: (members: any) => void;
    getUserId: () => void;
  }
}
