import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

interface IPreviewHOC {
  children: ReactNode;
  artifactId: string;
  shouldToggleSidebar?: boolean;
}

export const WithPreviewHOC = observer((props: IPreviewHOC) => {
  const { children, artifactId, shouldToggleSidebar = true } = props;
  const { togglePiArtifactsDrawer } = usePiChat();
  const { toggleSidebar } = useAppTheme();
  return (
    <button
      className="w-full flex flex-col gap-2 p-3 rounded-xl bg-custom-background-100 border-[0.5px] border-custom-border-200 overflow-hidden hover:shadow-sm animate-fade-in "
      disabled={!shouldToggleSidebar}
      onClick={() => {
        togglePiArtifactsDrawer(artifactId ?? "");
        toggleSidebar(true);
      }}
    >
      {children}
    </button>
  );
});
